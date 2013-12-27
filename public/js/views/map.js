/*global google */
define([
  "jquery",
  "underscore",
  "backbone",
  "../analytics",
  "async!//maps.googleapis.com/maps/api/js?key=" + window.googleApiKey + 
        "&sensor=false!callback",
  "./options_menu",
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
      this.eventLocationsCollection.on("reset", this.redrawMarkers, this);
      this.eventLocationsCollection.start();
    },

    redrawMarkers: function (newMarkers) {
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

    update: function () {
      this.updateLocation();
    },

    updateLocation: function () {
      if (this.mapNeedsUpdating()) {
        var center = this.model.get("center");
        this.map.panTo(new google.maps.LatLng(center[0], center[1]));
        this.map.setZoom(this.model.get("zoom"));
        this.locationChanged = true;
        setTimeout(_.bind(function () {
          this.locationChanged = false;
        }, this), 200);
      }
    },

    mapNeedsUpdating: function () {
      var modelPosition = {
        center: this.model.get("center"), 
        zoom: this.model.get("zoom")
      };
      var mapPosition = {
        center: this.getPosition(),
        zoom: this.getZoom()
      };
      
      return JSON.stringify(modelPosition) !== JSON.stringify(mapPosition);
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
    },

    onClick: function (e) {
      if (this.user.get("logged-in")) {
        this.closeOpenWindows()
        this.lastOptionsMenu = new OptionsMenu({
          event: e
        });
        this.lastOptionsMenu.render();
      }
    },

    onBoundsChanged: function () {
      if (!this.locationChanged) {
        window.lastEvent = "map";
      }
      this.model.set({
        "bounds": this.getBounds(),
        "center": this.getPosition(),
        "zoom": this.getZoom()
      });
    },

    getPosition: function () {
      var mce = this.map.getCenter();
      return [
        mce.lat(),
        mce.lng()
      ];
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
          color: this.getColor(result),
          fore: "#eeeeee",
          text: result.events.length.toString()
        }),
        position: new google.maps.LatLng(result.location[0], result.location[1])
      });

      google.maps.event.addListener(marker, "mouseover", _.bind(function () {
        analytics.infoBoxShown(result);
        this.closeOpenWindows();
        var info = new google.maps.InfoWindow({
          content: this.getContent(result)
        });
        info.open(this.map, marker);
        info.result = result;
        this.lastInfoWindow = info;

        $(".event_link").on("click", this.onLinkClick);

      }, this));

      return marker;

    },

    getColor: function (result) {

      var eventTime = new Date(_.last(result.events).start_date);

      var range = this.model.get("date");
      var start = new Date(range[0], 0, 1);
      var end = new Date(range[1], 12, 31);

      var diff = (end.getTime() - eventTime.getTime()) / 
                 (end.getTime() - start.getTime());

      var blue = Math.ceil(255 - 255 * diff);
      var red = Math.floor(255 * diff);

      var color = chroma.color("rgb(" + [red, 0, blue].join(",") + ")");

      return color.hex();
    },

    onLinkClick: function () {
      analytics.linkClicked(this.lastInfoWindow.result);
    },
    
    getContent: function (result) {
      return "<p>" + _.map(result.events, this.getEventText).join("<p>");
    },

    getEventText: function (event) {
      var date = new Date(event.start_date);
      return [
        "<a class=\"event_link\" href=\"" + encodeURI(event.event_link) + "\" target=\"_blank\" >" + 
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