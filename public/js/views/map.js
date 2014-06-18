/*global google */
define([
  "jquery",
  "underscore",
  "backbone",
  "moment",
  "models/current_user",
  "analytics",
  "async!//maps.googleapis.com/maps/api/js?key=" + window.googleApiKey +
        "&sensor=false!callback",
  "views/options_menu",
  "views/event_editor",
  "collections/events",
  "utils/position",
  "utils/scroll",
  "styled_marker",
  "chroma",
  "text!templates/info_window_summary.htm",
  "text!templates/info_window_entry.htm",
  "text!templates/info_window_entry_participant.htm",
  "less!../../css/map"
], function ($, _, Backbone, moment,
    User, analytics, maps, OptionsMenu,
    EventEditor, Events,
    Position, Scroll, StyledMarker, chroma,
    infoWindowSummaryTemplate, infoWindowEntryTemplate,
    infoWindowEntryParticipantTemplate) {

  var MapView = Backbone.View.extend({

    el: "#map-canvas",

    initialize: function (opts) {

      this.mapObjects = {};
      this.mapObjectsById = {};
      this.lastHighlight = {};
      this.lastModelPosition = {};
      this.eventLocationsCollection = opts.eventLocationsCollection;
      this.infoWindowSummaryTemplate = _.template(infoWindowSummaryTemplate);
      this.infoWindowEntryTemplate = _.template(infoWindowEntryTemplate);
      this.infoWindowEntryParticipantTemplate = _.template(infoWindowEntryParticipantTemplate);
    },

    render: function () {

      this.drawMap();
      this.model.on("change", this.update, this);
      this.model.on("change:selectedEventId", this.showHighlight, this);
      this.model.on("force-change", this.forceUpdate, this);
      this.eventLocationsCollection.on("reset", this.drawNewMarkers, this);
      this.eventLocationsCollection.start();
    },

    drawNewMarkers: function (newMarkers) {
      var toRemove = newMarkers[0];
      var toRender = newMarkers[1];

      _.each(toRemove, function (result) {
        var resultObj = JSON.parse(result);
        var mapObject = this.mapObjects[result];
        mapObject.setMap(null);
        delete this.mapObjects[result];
        delete this.mapObjectsById[resultObj.place_id];
      }, this);

      _.each(toRender, function (result) {
        var resultObj = JSON.parse(result);
        var mapObject = this.drawResult(resultObj);
        mapObject.setMap(this.map);
        this.mapObjects[result] = mapObject;
        this.mapObjectsById[resultObj.place_id] = [mapObject, resultObj];
      }, this);

      if (this.selectedEvent && this.selectedEvent.id !== this.lastEventIdShown) {
        this.showSelectedPoint();
      }
    },

    redrawMarkers: function () {
      var newMapObjects = {};
      var newMapObjectsById = {};

      _.each(this.mapObjects, function (mapObject, result) {
        mapObject.setMap(null);
        var resultObj = JSON.parse(result);
        var newMapObject = this.drawResult(resultObj);
        newMapObject.setMap(this.map);
        newMapObjects[result] = newMapObject;
        newMapObjectsById[resultObj.place_id] = [newMapObject, resultObj];
      }, this);

      this.showHighlight();

      this.mapObjects = newMapObjects;
      this.newMapObjectsById = newMapObjectsById;
    },

    showHighlight: function () {
      var highlight = this.model.get("highlight");
      if (this.paths) {
        _.each(this.paths, function (path) {
          path.setMap(null);
        });
      }
      if (highlight.id) {
        this.closeOpenWindows();
        var points = this.getHighlightPoints();
        var pairs = _.zip(_.initial(points), _.rest(points));

        var selectedEventId = this.model.get("selectedEventId");
        var isAnyUnselected = !(selectedEventId === null || selectedEventId === undefined);

        this.paths = _.map(pairs, _.bind(this.renderPath, this, isAnyUnselected, selectedEventId));

        var selectedPoint = this.getSelectedPlaceId(selectedEventId, points);
        if (selectedPoint) {
          this.selectedEvent = {
            id: selectedEventId,
            place_id: selectedPoint.place_id
          };
          this.showSelectedPoint();
        }
      } else {
        this.paths = [];
        this.selectedEvent = null;
      }
    },

    getHighlightPoints: function () {
      var highlight = this.model.get("highlight");
      var importance = this.model.get("importance");
      var modelDate = this.model.get("date");
      var pointsInRange = _.filter(highlight.points, function (point) {
        if (point.importance_value < importance) {
          return false;
        }
        var pointDate = new Date(point.start_date).getFullYear();
        return (pointDate >= modelDate[0]) && (pointDate <= modelDate[1]);
      });
      var points = _.map(pointsInRange, function (point) {
        var latLng = new google.maps.LatLng(point.lat, point.lon);
        latLng.start_date = point.start_date;
        latLng.event_id = point.event_id;
        latLng.place_id = point.place_id;
        return latLng;
      });
      return points;
    },

    showSelectedPoint: function () {
      if (this.selectedEvent && this.mapObjectsById[this.selectedEvent.place_id]) {
        this.lastEventIdShown = this.selectedEvent.id;
        this.showInfoWindow.apply(this, this.mapObjectsById[this.selectedEvent.place_id]);
      }
    },

    getSelectedPlaceId: function (selectedEventId, points) {
      return _.find(points, function (point) {
        return point.event_id === selectedEventId;
      });
    },

    renderPath: function (isAnyUnselected, selectedEventId, pair) {
      var shouldDim = isAnyUnselected;
      if ((pair[0].event_id === selectedEventId) || (pair[1].event_id === selectedEventId)) {
        shouldDim = false;
      }

      var path = new google.maps.Polyline({
        path: pair,
        strokeColor: this.getColor(new Date(pair[0].start_date), shouldDim),
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
      path.setMap(this.map);
      return path;
    },

    forceUpdate: function () {
      var center = this.map.getCenter();
      window.lastEvent = "resize";
      google.maps.event.trigger(this.map, "resize");
      this.map.setCenter(center);
      setTimeout(function () {
        if (window.lastEvent === "resize") {
          window.lastEvent = "";
        }
      }, 1000);
    },

    update: function () {
      this.updateLocation();
    },

    updateLocation: function () {
      if (this.mapNeedsUpdating()) {
        var center = this.model.get("center");
        var mapCenter = this.map.getCenter();
        if ((mapCenter.lat() !== center[0]) || (mapCenter.lng() !== center[1])) {
          this.map.panTo(new google.maps.LatLng(center[0], center[1]));
        }
        if (this.model.get("zoom") === -1) {
          var newBounds = this.model.get("bounds");
          var boundsObj = new google.maps.LatLngBounds();
          boundsObj.extend(new google.maps.LatLng(newBounds[0].lat, newBounds[0].lon));
          boundsObj.extend(new google.maps.LatLng(newBounds[1].lat, newBounds[1].lon));
          this.map.fitBounds(boundsObj);
          this.model.set("zoom", this.map.getZoom());
          this.model.set("bounds", null);
        } else {
          if (this.map.getZoom() !== this.model.get("zoom")) {
            this.map.setZoom(this.model.get("zoom"));
          }
        }

        this.locationChanged = true;
        setTimeout(_.bind(function () {
          this.locationChanged = false;
        }, this), 200);
      }
      if (this.mapNeedsRedrawing()) {
        this.redrawMarkers();
        this.lastHighlight = this.model.get("highlight");
        this.lastImportance = this.model.get("importance");
      }
      this.lastModelPosition = this.getModelPosition();
    },


    mapNeedsUpdating: function () {
      return !this.dontRedraw && !_.isEqual(this.getModelPosition(), this.lastModelPosition);
    },

    getModelPosition: function () {
      return {
        center: this.model.get("center"),
        zoom: this.model.get("zoom"),
        date: this.model.get("date")
      };
    },

    mapNeedsRedrawing: function () {
      return !_.isEqual(this.model.get("highlight"), this.lastHighlight) ||
        !_.isEqual(this.model.get("importance"), this.lastImportance) ||
        !_.isEqual(this.getModelPosition().date, this.lastModelPosition.date);
    },

    drawMap: function () {
      var center = this.model.get("center");
      var mapOptions = {
        zoom: this.model.get("zoom"),
        center: new google.maps.LatLng(center[0], center[1]),
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      this.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

      google.maps.event.addListener(this.map, "bounds_changed", _.bind(this.onBoundsChanged, this));
      google.maps.event.addListener(this.map, "click", _.bind(this.onClick, this));
      google.maps.event.addListener(this.map, "dblclick", _.bind(this.onDblClick, this));
    },

    onClick: function (e) {
      setTimeout(_.bind(function () {
        if (!this.dblClicked) {
          if (User.user.get("logged-in") && User.user.hasPermission("add-event")) {
            this.closeOpenWindows();
            this.lastOptionsMenu = new OptionsMenu({
              event: e,
              model: this.model,
              parent: this.$el
            });
            this.lastOptionsMenu.render();
            analytics.optionsMenuShown();
          }
        }
      }, this), 200);
    },

    onDblClick: function () {
      this.dblClicked = true;
      setTimeout(_.bind(function () {
        this.dblClicked = false;
      }, this), 500);
      this.closeOpenWindows();
    },

    onBoundsChanged: function () {
      if (!this.locationChanged && (window.lastEvent !== "resize")) {
        window.lastEvent = "map";
      }
      this.hideOptionsMenu();
      this.dontRedraw = true;
      this.model.set({
        "bounds": this.getBounds(),
        "center": this.getPosition(),
        "zoom": this.getZoom()
      });
      this.dontRedraw = false;
    },

    getPosition: function () {
      var mce = this.map.getCenter();
      return [
        Position.normalisePosition(mce.lat()),
        Position.normalisePosition(mce.lng())
      ];
    },

    getBounds: function () {
      var bounds = this.map.getBounds();
      var ne = bounds.getNorthEast();
      var sw = bounds.getSouthWest();
      return [
        {lat: ne.lat(), lon: ne.lng()},
        {lat: sw.lat(), lon: sw.lng()}
      ];
    },

    getZoom: function () {
      return this.map.getZoom();
    },

    drawResult: function (resultObj) {
      // return (resultObj.location.length === 1) ?
      //     this.drawPoint(resultObj) :
      //     this.drawShape(resultObj);
      return this.drawPoint(resultObj);
    },

    drawPoint: function (result) {
      var marker;
      var eventTime = new Date(_.first(result.events).start_date);
      marker = new StyledMarker.StyledMarker({
        styleIcon: new StyledMarker.StyledIcon(StyledMarker.StyledIconTypes.MARKER, {
          color: this.getColor(eventTime, this.isDimmed(result.events)),
          fore: "#eeeeee",
          text: this.getMarkerText(result.events)
        }),
        position: new google.maps.LatLng(result.location[0], result.location[1])
      });

      google.maps.event.addListener(marker, "mouseover",
        _.bind(this.showInfoWindow, this, marker, result)
      );

      return marker;

    },

    showInfoWindow: function (marker, infoWindowData) {
      this.closeOpenWindows();
      var info = new google.maps.InfoWindow({
        content: this.getContent(infoWindowData)
      });
      info.open(this.map, marker);
      info.result = infoWindowData;
      this.openInfoWindows = this.openInfoWindows || [];
      this.openInfoWindows.push(info);
      setTimeout(_.bind(this.afterShowInfoWindow, this), 10);
      this.infoWindowAnalyticsTimeout = setTimeout(_.bind(function () {
        analytics.infoWindowShown(this.getInfoWindowData(infoWindowData));
      }, this), 1000);
    },

    closeOpenWindows: function () {
      if (this.infoWindowAnalyticsTimeout) {
        clearTimeout(this.infoWindowAnalyticsTimeout);
      }
      _.each(this.openInfoWindows, function (infoWindow) {
        infoWindow.close();
      }, this);
      this.openInfoWindows = [];
      this.hideOptionsMenu();
    },

    hideOptionsMenu: function () {
      if (this.lastOptionsMenu) {
        this.lastOptionsMenu.close();
      }
    },

    afterShowInfoWindow: function () {
      $(".event-entry .event-link").on("click", _.bind(this.onLinkClick, this));
      $(".event-entry .search").on("click", _.bind(this.onSearchClick, this));
      $(".event-entry .edit").on("click", _.bind(this.onEditClick, this));

      if ($(".content-holder").height() >= 200) {
        //This is an ugly hack to allow us to put scroll bars on.
        //Without it some weird thing happens where the scroll
        //height takes into account the width with the scrollbars
        //so it shows them unnecessarily

        $(".gm-style-iw").addClass("fix-height");
        $(".gm-style-iw .summary").insertAfter($(".gm-style-iw .content-holder"));
        //This is an ugly hack to make the InfoWindow allow
        //us to chose the width of the box without it taking it into account
        setTimeout(_.bind(function () {
          var width = $(".gm-style-iw").parent().width() - 23;
          this.$(".event-entry").css("width", (width - 11) + "px !important");
          $(".gm-style-iw").width(width);
          $(".gm-style-iw").addClass("fix-height2");
          this.highlightEntry();
        }, this), 10);
      }

      this.highlightEntry();

    },

    highlightEntry: function () {

      var highlight = this.model.get("highlight");
      var el;

      if (highlight.id) {
        var el;
        if (this.selectedEvent) {
          el = $(".event-entry[data-id=" + this.selectedEvent.id + "]");
        }
        if (!el || el.length === 0) {
          el = $(".event-entry[data-thing-id=" + highlight.id + "]");
        }
        if (el && el.length) {
          Scroll.intoView(el, el.parent(), 50);
          setTimeout(function () {
            $(".gm-style-iw").addClass("fix-height3");
          }, 100);
        }
      }
    },

    onSearchClick: function (e) {
      var data = this.getMarkerData(e);
      var modelData = {
        "query": data.thingName,
        "highlight": {id: data.thingId, reset: true},
        "selectedEventId": data.id
      };
      if (data.importanceValue < this.model.get("importance")) {
        modelData.importance = data.importanceValue;
      }
      this.model.set(modelData);
      analytics.mapEntrySearched(data);
    },

    onEditClick: function (e) {
      var data = this.getMarkerData(e);
      this.createEventEditor(data);
      analytics.mapEntryEdited(data);
    },

    createEventEditor: function (data) {
      return new EventEditor({
        state: this.model,
        model: new Events.instance.model(data, {collection: Events.instance})
      }).render();
    },

    getMarkerData: function (e) {
      return _.extend(
        $(e.target).parent().parent().data(),
        $(e.target).parent().data()
      );
    },

    getMarkerText: function (events) {
      if (events.length >= 100) {
        return "∞";
      } else {
        return events.length.toString();
      }
    },

    getInfoWindowData: function (results) {
      var data = {};
      data.lat = results.location[0];
      data.lon = results.location[1];
      data.placeName = results.events[0].place_thing_name;
      data.eventNames = _.unique(_.pluck(results.events, "event_name"));
      var getDate = function (x) {
        return new Date(x).getTime();
      };
      data.startDate = _.min(_.pluck(results.events, "start_date"), getDate);
      data.endDate = _.max(_.pluck(results.events, "end_date"), getDate);
      return data;
    },

    getColor: function (eventTime, isDimmed) {
      var range = this.model.get("date");
      var start = new Date(range[0], 0, 1);
      var end = new Date(range[1], 12, 31);

      var diff = 1 - ((end.getTime() - eventTime.getTime()) /
                      (end.getTime() - start.getTime()));

      var scale = chroma.scale(["red", "blue"]);
      var color = scale(diff);

      if (isDimmed) {
        color = color.desaturate(30);
        color = color.brighter(30);
      }

      return color.hex();
    },

    isDimmed: function (events) {
      var highlight = this.model.get("highlight");

      var thingEvents = _.pluck(_.flatten(_.pluck(events, "participants")), "thing_id");
      var placeEvents = _.pluck(events, "place_thing_id");
      var allEvents = thingEvents.concat(placeEvents);

      var isHighlighted =
        _.intersection(
          [highlight.id],
          allEvents
        ).length > 0;

      return !!highlight.id && !isHighlighted;
    },

    onLinkClick: function (e) {
      analytics.linkClicked($(e.target).parent().data());
    },

    getContent: function (result) {
      var content = [
        "<div>",
        this.getInfoWindowSummary(result),
        "<div class='content-holder'><div class='content'>",
        _.map(result.events, this.getInfoWindowEntry, this).join(""),
        "</div></div>",
        "</div>"
      ].join("");
      return content;
    },

    getInfoWindowSummary: function (result) {
      var name = result.events[0].place_thing_name;
      var link = result.events[0].place_thing_link;
      return this.infoWindowSummaryTemplate({
        name: name,
        link: link
      });
    },

    getInfoWindowEntry: function (event) {
      return this.infoWindowEntryTemplate(_.extend({
        canEdit: User.user.get("logged-in") && User.user.hasPermission("edit-event"),
        participantTemplate: this.infoWindowEntryParticipantTemplate,
        date: this.getDateRangeString(event),
        highlighted: this.shouldHighlightInfoWindowEntry(event)
      }, event));
    },

    shouldHighlightInfoWindowEntry: function (event) {
      var highlight = this.model.get("highlight");
      var selectedEventId = this.model.get("selectedEventId");

      if (selectedEventId) {
        return event.event_id === selectedEventId;
      } else {
        var highlighted =
          _.intersection(
            [highlight.id],
            _.pluck(event.participants, "thing_id")
          ).length > 0;
        return highlighted;
      }
    },

    getDateRangeString: function (event) {
      var start = moment(event.start_date)
        .add("seconds", event.start_offset_seconds)
        .add("minutes", -moment(event.start_date).toDate().getTimezoneOffset());

      var end = moment(event.end_date)
        .add("seconds", event.end_offset_seconds)
        .add("minutes", -moment(event.end_date).toDate().getTimezoneOffset());

      var str = this.getDateString(start);
      var zero = moment({y: 0, M: 0, d: 1});
      var isSwitch = start.isBefore(zero) && end.isAfter(zero);
      if ((+end - +start) > 24 * 60 * 60 * 1000) {
        if (isSwitch) {
          str += " BCE";
        }
        str += " - " + this.getDateString(end);
        if (end.isBefore(zero)) {
          str += " BCE";
        } else if (isSwitch) {
          str += " CE";
        }
      } else {
        if (start.isBefore(zero)) {
          str += " BCE";
        }
      }
      return str;
    },

    getDateString: function (date) {
      if (date.isBefore(moment({y: 1000}))) {
        return date.format("DD/MM/") + Math.abs(date.toDate().getFullYear());
      } else {
        return date.format("DD/MM/YYYY");
      }
    },


    drawShape: function (result) {
      return new google.maps.Polygon({
        path: _.map(result.location, function (x) {
          return new google.maps.LatLng(x[0], x[1]);
        }),
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillColor: "#558822",
        fillOpacity: 0.5,
        map: this.map
      });
    }
  });
  return MapView;
});