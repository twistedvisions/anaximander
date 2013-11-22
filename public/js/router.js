define([
  "jquery",
  "underscore",
  "backbone",
  "./utils/filter_url_serialiser",
  "./analytics"
], function ($, _, Backbone, FilterUrlSerialiser, analytics) {
  var Router = Backbone.Router.extend({
    
    routes: {
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end": "mapView",
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/filter/:filter": "filteredMapView"
    },

    mapView: function (lat, lon, zoom, start, end) {
      this.filteredMapView(lat, lon, zoom, start, end, null);
      this.setFromUrl = true;
    },
    filteredMapView: function (lat, lon, zoom, start, end, filters) {
      var data = {
        date: [start, end],
        center: [lat, lon],
        zoom: parseInt(zoom, 10)
      };

      window.lastEvent = "url_change";

      if (filters) {
        FilterUrlSerialiser.deserialise(filters, this.model);
      }

      this.model.set(data);
      this.model.trigger("change:filterState");  
    },

    init: function (options) {
      this.model = options.model;
      this.model.on("change", _.bind(this.handleChange, this));
      Backbone.history.start();
      if (!this.setFromUrl) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(_.bind(function (position) {
            var latitude = position.coords.latitude;
            var longitude = position.coords.longitude;
            this.model.set({
              "center": [latitude, longitude]
            });
          }, this));
        }
      }
    },

    handleChange: function () {
      var date = this.model.get("date");
      var center = this.model.get("center");
      var zoom = this.model.get("zoom");
      var filterState = this.model.get("filterState").toJSON();
      var filters = "";
      var location = [
        "lat", center[0],
        "lon", center[1],
        "zoom", zoom,
        "start", date[0],
        "end", date[1]
      ];

      if (filterState.length > 0) {
        location.push("filter");
        filters = FilterUrlSerialiser.serialise(this.model);
        location.push(filters);
      }

      this.navigate(location.join("/"));

      this.sendAnalytics(center, zoom, date);
    },
    sendAnalytics: _.debounce(function (center, zoom, date) {
      analytics.navigation({
        lat: center[0],
        lon: center[1],
        zoom: zoom,
        start: parseInt(date[0], 10),
        end: parseInt(date[1], 10)
      });
    }, 500)
  });

  return Router;
});