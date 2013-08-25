define([
  'jquery',
  'underscore',
  'backbone'
], function ($, _, Backbone) {

  var MapView = Backbone.View.extend({
    el: '#map-canvas',

    initialize: function (opts) {
      this.center = [53.24112905344493, 6.191539001464932];
      this.zoom = 9;
      this.lastResults = [];
      this.mapObjects = {};
      this.lastInfoWindow = null;
      this.getDataAtLocation = _.bind(_.debounce(this._getDataAtLocation, 500), this);
    },

    render: function () {
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "http://maps.googleapis.com/maps/api/js?key=" + window.googleApiKey + 
        "&sensor=false&callback=initMap";
      document.body.appendChild(script);

      window.initMap = _.bind(function () {
        this.drawMap();
        this.getDataAtLocation();
      }, this);

      this.model.on("change", this._getDataAtLocation, this);
    },

    drawMap: function () {
      var center = this.model.get("center");
      var mapOptions = {
        zoom: this.model.get("zoom"),
        center: new google.maps.LatLng(center[0], center[1]), 
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      window.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

      google.maps.event.addListener(map, 'bounds_changed', _.bind(function () {
        //TODO: should init these on render
        this.model.set({
          "radius": this.getRadius(),
          "center": this.getPosition()
        });
      }, this));
    },

    getPosition: function () {
      var mce = map.getCenter();
      return [
        mce.lat(),
        mce.lng()
      ];
    },

    getRadius: function () {
      var bounds = map.getBounds();
      var ne = bounds.getNorthEast();
      var sw = bounds.getSouthWest();
      var extent_vertical = ne.lat() - sw.lat();
      var extent_horizontal = ne.lng() - sw.lng();
      var furthestExtent = Math.max(extent_vertical, extent_horizontal);
      return furthestExtent / 2;
    },

    _getDataAtLocation: function () {
      var position = this.model.get("center");
      var timeRange = this.model.get("date");
      var radius = this.model.get("radius");
      var pad = function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
      };
      var formatYear = function (year) {
        return pad(Math.abs(year), 4, 0);
      };
      var getStartOfYear = function (year) {
        var isBc = year < 0;
        return formatYear(year) + "-01-01" + (isBc ? " BC" : "");
      };
      var getEndOfYear = function (year) {
        var isBc = year < 0;
        return formatYear(year) + "-12-31" + (isBc ? " BC" : "");
      };
      $.get(
        "/location", 
        {
          lat: position[0], 
          lon: position[1], 
          radius: radius,
          start: getStartOfYear(timeRange[0]), 
          end: getEndOfYear(timeRange[1])
        }, 
        _.bind(this.handleResults, this)
      );
    },
    handleResults: function (results) {

      var oldResultsAsKeys = _.map(this.lastResults, this.makeKey, this);
      var newResultsAsKeys = _.map(results, this.makeKey, this);

      var toRemove = _.difference(oldResultsAsKeys, newResultsAsKeys);
      var toRender = _.difference(newResultsAsKeys, oldResultsAsKeys);

      if (this.debug) {

        console.log("total", results.length);
        console.log("removing", toRemove.length);
        console.log("remaining", this.lastResults.length - toRemove.length);
        console.log("rendering", toRender.length);
      }

      _.each(toRemove, function (result) {
        mapObject = this.mapObjects[result];
        mapObject.setMap(null);
        delete this.mapObjects[result];
      }, this);

      _.each(toRender, function (result) {
        resultObj = JSON.parse(result);      
        var mapObject = (resultObj.location.length === 1) ? 
          this.drawPoint(resultObj) : 
          this.drawShape(resultObj);
        mapObject.setMap(map);
        this.mapObjects[result] = mapObject;
      }, this);

      this.lastResults = results;
    },

    makeKey: function (result) {
      var keys = _.keys(result);
      keys.sort();
      return "{" + _.map(keys, function (key) {
        var el = result[key];
        return "\"" + key + "\":" + 
          ((_.isObject(el) && !_.isDate(el) && !_.isArray(el)) ? 
            this.makeKey(el) : 
            JSON.stringify(el));
      }, this).join(",") + "}";
    },
    drawPoint: function (result) {
      var marker = new google.maps.Marker({
        title: result.person_name,
        position: new google.maps.LatLng(result.location[0][0], result.location[0][1])
      });

      google.maps.event.addListener(marker, 'mouseover', _.bind(function() {
        if (this.lastInfoWindow) {
          this.lastInfoWindow.close();  
        }
        var info = new google.maps.InfoWindow({
          content: [
            "<a href='" + result.person_link + "' target='_blank' >" + result.event_name + "</a>",
            new Date(result.start_date).toLocaleDateString()
          ].join("<br/>")
        });
        info.open(this.map, marker);
        this.lastInfoWindow = info;
      }), this);

      return marker;

    },

    drawShape: function (result) {
      return new google.maps.Polygon({
        path: _.map(result.location, function (x) {
          return new google.maps.LatLng(x[0], x[1]);
        }),
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillColor: "#558822",
        fillOpacity: 0.5,
        map: map
      });
    }
  });

  return MapView;
});