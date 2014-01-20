/*global google */
define([
  "jquery",
  "underscore",
  "backbone",
  "analytics",
  "async!//maps.googleapis.com/maps/api/js?key=" + window.googleApiKey +
        "&sensor=false!callback",
  "views/options_menu",
  "styled_marker",
  "chroma",
  "css!/css/map"
], function ($, _, Backbone, analytics, maps, OptionsMenu, StyledMarker, chroma) {

  var MapView = Backbone.View.extend({

    el: "#map-canvas",

    initialize: function (opts) {

      this.mapObjects = {};
      this.user = opts.user;
      this.eventLocationsCollection = opts.eventLocationsCollection;
      this.onLinkClick = _.bind(this.onLinkClick, this);
    },

    render: function () {

      this.drawMap();
      this.model.on("change", this.update, this);
      this.model.on("force-change", this.forceUpdate, this);
      this.eventLocationsCollection.on("reset", this.drawNewMarkers, this);
      this.eventLocationsCollection.start();
    },

    drawNewMarkers: function (newMarkers) {
      var toRemove = newMarkers[0];
      var toRender = newMarkers[1];

      _.each(toRemove, function (result) {
        var mapObject = this.mapObjects[result];
        mapObject.setMap(null);
        delete this.mapObjects[result];
      }, this);

      _.each(toRender, function (result) {
        var resultObj = JSON.parse(result);
        var mapObject = this.drawResult(resultObj);
        mapObject.setMap(this.map);
        this.mapObjects[result] = mapObject;
      }, this);
    },

    redrawMarkers: function () {
      var newMapObjects = {};

      _.each(this.mapObjects, function (mapObject, result) {
        mapObject.setMap(null);
        var resultObj = JSON.parse(result);
        var newMapObject = this.drawResult(resultObj);
        newMapObject.setMap(this.map);
        newMapObjects[result] = newMapObject;
      }, this);

      this.showHighlights();

      this.mapObjects = newMapObjects;
    },

    showHighlights: function () {
      var highlights = this.model.get("highlights");

      if (this.paths) {
        _.each(this.paths, function (path) {
          path.setMap(null);
        });
      }
      if (highlights) {
        this.paths = _.map(highlights, function (highlight) {
          var points = _.map(highlight.points, function (point) {
            return new google.maps.LatLng(point.lat, point.lon);
          });
          var path = new google.maps.Polyline({
            path: points,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2
          });
          path.setMap(this.map);
          return path;
        }, this);
      } else {
        this.paths = [];
      }
    },

    forceUpdate: function () {
      var center = this.map.getCenter();
      google.maps.event.trigger(this.map, "resize");
      this.map.setCenter(center);
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
          //TODO: make sure this bounds is the same type of bounds as in
          //getBounds() in this file
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
        this.lastHighlights = this.model.get("highlights");
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
      return this.model.get("highlights") !== this.lastHighlights;
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
          if (this.user.get("logged-in") && this.user.hasPermission("add-event")) {
            this.closeOpenWindows();
            this.lastOptionsMenu = new OptionsMenu({
              event: e,
              model: this.model
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
      if (!this.locationChanged) {
        window.lastEvent = "map";
      }
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
        this.normalisePosition(mce.lat()),
        this.normalisePosition(mce.lng())
      ];
    },

    normalisePosition: function (x) {
      while (x < 180) {
        x += 360;
      }
      while (x > 180) {
        x -= 360;
      }
      return x;
    },

    getBounds: function () {
      var bounds = this.map.getBounds();
      var ne = bounds.getNorthEast();
      var sw = bounds.getSouthWest();
      return [[ne.lat(), ne.lng()], [sw.lat(), sw.lng()]];
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
      marker = new StyledMarker.StyledMarker({
        styleIcon: new StyledMarker.StyledIcon(StyledMarker.StyledIconTypes.MARKER, {
          color: this.getColor(result, this.isDimmed(result.events)),
          fore: "#eeeeee",
          text: this.getMarkerText(result.events)
        }),
        position: new google.maps.LatLng(result.location[0], result.location[1])
      });

      google.maps.event.addListener(marker, "mouseover", _.bind(function () {
        setTimeout(_.bind(function () {
          analytics.infoBoxShown(this.getInfoBoxData(result));
        }, this), 1000);
        analytics.infoBoxShown(this.getInfoBoxData(result));
        this.closeOpenWindows();
        var info = new google.maps.InfoWindow({
          content: this.getContent(result)
        });
        info.open(this.map, marker);
        info.result = result;
        this.lastInfoWindow = info;
        setTimeout(_.bind(function () {
          $(".event_link").on("click", this.onLinkClick);
        }, this), 100);

      }, this));

      return marker;

    },

    getMarkerText: function (events) {
      if (events.length >= 100) {
        return "∞";
      } else {
        return events.length.toString();
      }
    },

    getInfoBoxData: function (results) {
      var data = {};
      data.lat = results.location[0];
      data.lon = results.location[1];
      data.distance = results.events[0].distance;
      data.thingTypes = _.unique(_.pluck(results.events, "thing_type"));
      data.eventNames = _.unique(_.pluck(results.events, "event_name"));
      var getDate = function (x) {
        return new Date(x).getTime();
      };
      data.startDate = _.min(_.pluck(results.events, "start_date"), getDate);
      data.endDate = _.max(_.pluck(results.events, "end_date"), getDate);
      return data;
    },

    getColor: function (result, isDimmed) {
      var eventTime = new Date(_.first(result.events).start_date);
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
      var highlights = this.model.get("highlights") || false;

      var isHighlighted =
        highlights &&
        _.intersection(
          _.pluck(highlights, "id"),
          _.pluck(events, "thing_id").concat(_.pluck(events, "place_thing_id"))
        ).length > 0;

      return highlights && (highlights.length > 0) && !isHighlighted;
    },

    onLinkClick: function (e) {
      analytics.linkClicked($(e.target).data());
    },

    getContent: function (result) {
      return "<p>" + _.map(result.events, this.getEventText).join("<p>");
    },

    getEventText: function (event) {
      var date = new Date(event.start_date);
      var attributes = [];
      attributes.push("class=\"event_link\"");
      attributes.push("href=\"" + encodeURI(event.event_link) + "\"");
      attributes.push("target=\"_blank\"");
      attributes.push("data-name=\"" + event.event_name + "\"");
      attributes.push("data-link=\"" + event.event_link + "\"");
      attributes.push("data-lat=\"" + event.location[0][0] + "\"");
      attributes.push("data-lon=\"" + event.location[0][1] + "\"");
      attributes.push("data-start-date=\"" + event.start_date + "\"");
      attributes.push("data-end-date=\"" + event.end_date + "\"");
      return [
        "<a " + attributes.join(" ") + " >" +
        event.event_name + "</a>",
        date.getDate() + "/" + (date.getMonth() + 1) + "/" +
        Math.abs(date.getFullYear()) +
        (date.getFullYear() < 0 ? " BC" : "")
      ].join("<br/>");
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
    },

    closeOpenWindows: function () {
      if (this.lastInfoWindow) {
        this.lastInfoWindow.close();
      }
      if (this.lastOptionsMenu) {
        this.lastOptionsMenu.close();
      }
    }
  });
  return MapView;
});