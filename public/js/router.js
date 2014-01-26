define([
  "jquery",
  "underscore",
  "backbone",
  "utils/filter_url_serialiser",
  "analytics"
], function ($, _, Backbone, FilterUrlSerialiser, analytics) {
  var Router = Backbone.Router.extend({

    routes: {
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end": "mapView",
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/filter/:filter": "filteredMapView",
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/query/:query": "queryMapView",
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/query/:query/highlight/:highlight": "queryHighlightedMapView",
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/filter/:filter/query/:query/highlight/:highlight": "filteredQueryHighlightedMapView"
    },

    mapView: function (lat, lon, zoom, start, end) {
      this.filteredQueryHighlightedMapView(lat, lon, zoom, start, end, null, null, null);
    },

    filteredMapView: function (lat, lon, zoom, start, end, filters) {
      this.filteredQueryHighlightedMapView(lat, lon, zoom, start, end, filters, null, null);
    },

    queryMapView: function (lat, lon, zoom, start, end, query) {
      this.filteredQueryHighlightedMapView(lat, lon, zoom, start, end, null, query, null);
    },

    queryHighlightedMapView: function (lat, lon, zoom, start, end, query, highlight) {
      this.filteredQueryHighlightedMapView(lat, lon, zoom, start, end, null, query, highlight);
    },

    filteredQueryHighlightedMapView: function (lat, lon, zoom, start, end, filters, query, highlight) {

      this.setFromUrl = true;

      var data = {
        date: [parseInt(start, 10), parseInt(end, 10)],
        center: [parseFloat(lat), parseFloat(lon)],
        zoom: parseInt(zoom, 10),
        query: query && decodeURIComponent(query)
      };

      this.getHighlightChange(data, highlight);

      window.lastEvent = "url_change";

      var oldFilters = "";
      var newFilters = "";
      if (filters) {
        oldFilters = this.model.get("filterState").toJSON();
        FilterUrlSerialiser.deserialise(filters, this.model);
        newFilters = this.model.get("filterState").toJSON();
      }

      this.removeUnchangedData(data);

      this.model.set(data);
      if (!_.isEqual(oldFilters, newFilters)) {
        this.model.trigger("change:filterState");
      }
    },

    getHighlightChange: function (data, highlight) {
      if (highlight) {
        data.highlight = {id: parseInt(highlight, 10)};
        if (data.highlight.id === this.model.get("highlight").id) {
          delete data.highlight;
        }
      } else {
        data.highlight = {};
      }
    },

    removeUnchangedData: function (data) {
      if (this.model.get("date") &&
          (data.date[0] === this.model.get("date")[0]) &&
          (data.date[1] === this.model.get("date")[1])) {
        delete data.date;
      }

      if (this.model.get("center") &&
          (data.center[0] === this.model.get("center")[0]) &&
          (data.center[1] === this.model.get("center")[1])) {
        delete data.center;
      }

      if (data.zoom === this.model.get("zoom")) {
        delete data.zoom;
      }

      if (data.query === this.model.get("query")) {
        delete data.query;
      }
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
      var query = this.model.get("query");
      var filterState = this.model.get("filterState").toJSON();
      var highlight = this.model.get("highlight");
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

      } else if (query) {

        location.push("query");
        location.push(encodeURIComponent(query));

        if (highlight.id) {

          location.push("highlight");
          location.push(highlight.id);

        }
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