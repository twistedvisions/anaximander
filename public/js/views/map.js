/*global google, StyledIconTypes, StyledMarker, StyledIcon */
define([
  "jquery",
  "underscore",
  "backbone",
  "../collections/events",
  "../analytics",
  "async!//maps.googleapis.com/maps/api/js?key=" + window.googleApiKey + 
        "&sensor=false!callback",
  "styled_marker"
], function ($, _, Backbone, EventCollection, analytics) {

  var MapView = Backbone.View.extend({
    
    el: "#map-canvas",

    initialize: function (opts) {

      this.mapObjects = {};
      this.eventsCollection = new EventCollection({state: this.model});
      this.onLinkClick = _.bind(this.onLinkClick, this);
    },

    render: function () {
      
      this.drawMap();
      this.model.on("change", this.update, this);
      this.eventsCollection.on("reset", this.redrawMarkers, this);
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

      google.maps.event.addListener(this.map, "bounds_changed", _.bind(function () {
        window.lastEvent = "map";
        this.model.set({
          "radius": this.getRadius(),
          "center": this.getPosition(),
          "zoom": this.getZoom()
        });
      }, this));
    },

    getPosition: function () {
      var mce = this.map.getCenter();
      return [
        mce.lat(),
        mce.lng()
      ];
    },

    getRadius: function () {
      var bounds = this.map.getBounds();
      var ne = bounds.getNorthEast();
      var sw = bounds.getSouthWest();
      var extent_vertical = ne.lat() - sw.lat();
      var extent_horizontal = ne.lng() - sw.lng();
      var furthestExtent = Math.max(extent_vertical, extent_horizontal);
      return furthestExtent / 2;
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

      marker = new StyledMarker({
        styleIcon: new StyledIcon(StyledIconTypes.MARKER, {
          color: "00ff00",
          text: result.events.length.toString()
        }),
        position: new google.maps.LatLng(result.location[0], result.location[1])
      });

      google.maps.event.addListener(marker, "mouseover", _.bind(function () {
        analytics.infoBoxShown(result);
        if (this.lastInfoWindow) {
          this.lastInfoWindow.close();  
        }
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

    onLinkClick: function () {
      analytics.linkClicked(this.lastInfoWindow.result);
    },
    
    getContent: function (result) {
      return _.map(result.events, this.getEventText).join("<p>");
    },

    getEventText: function (event) {
      var date = new Date(event.start_date);
      return [
        "<a class='event_link' href='" + event.event_link + "' target='_blank' >" + event.event_name + "</a>",
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
    }
  });
  return MapView;
});