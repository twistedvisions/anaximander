define([
  "jquery",
  "underscore",
  "backbone",
  "utils/filter_url_serialiser",
  "analytics"
], function ($, _, Backbone, FilterUrlSerialiser, analytics) {
  var Router = Backbone.Router.extend({

    routes: {
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/importance/:importance": "mapView",
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/importance/:importance/filter/:filter": "filteredMapView",
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/importance/:importance/query/:query": "queryMapView",
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/importance/:importance/query/:query/highlight/:highlight": "queryHighlightedMapView",
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/importance/:importance/query/:query/highlight/:highlight/state/:state": "queryHighlightedStateMapView",
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/importance/:importance/filter/:filter/query/:query/highlight/:highlight": "filteredQueryHighlightedMapView",
      "lat/:lat/lon/:lon/zoom/:zoom/start/:start/end/:end/importance/:importance/filter/:filter/query/:query/highlight/:highlight/state/:state": "filteredQueryHighlightedStateMapView"
    },

    mapView: function (lat, lon, zoom, start, end, importance) {
      this.filteredQueryHighlightedStateMapView(
        lat, lon, zoom, start, end, importance,
        null, null, null, null
      );
    },

    filteredMapView: function (lat, lon, zoom, start, end, importance, filters) {
      this.filteredQueryHighlightedStateMapView(
        lat, lon, zoom, start, end, importance,
        filters, null, null, null
      );
    },

    queryMapView: function (lat, lon, zoom, start, end, importance, query) {
      this.filteredQueryHighlightedStateMapView(
        lat, lon, zoom, start, end, importance,
        null, query, null, null
      );
    },

    queryHighlightedMapView: function (lat, lon, zoom, start, end, importance, query, highlight) {
      this.filteredQueryHighlightedStateMapView(
        lat, lon, zoom, start, end, importance,
        null, query, highlight, null
      );
    },

    queryHighlightedStateMapView: function (lat, lon, zoom, start, end, importance, query, highlight, state) {
      this.filteredQueryHighlightedStateMapView(
        lat, lon, zoom, start, end, importance,
        null, query, highlight, state
      );
    },

    filteredQueryHighlightedMapView: function (lat, lon, zoom, start, end, importance, filters, query, highlight) {
      this.filteredQueryHighlightedStateMapView(
        lat, lon, zoom, start, end, importance,
        filters, query, highlight, null
      );
    },

    filteredQueryHighlightedStateMapView: function (lat, lon, zoom, start, end, importance, filters, query, highlight, state) {

      this._setFromUrl = true;

      var data = {
        date: [parseInt(start, 10), parseInt(end, 10)],
        center: [parseFloat(lat), parseFloat(lon)],
        zoom: parseInt(zoom, 10),
        importance: parseInt(importance, 10),
        query: query && decodeURIComponent(query)
      };

      this.getHighlightChange(data, highlight);

      if (state) {
        data.selectedEventId = parseInt(state, 10);
      }

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

      if (data.importance === this.model.get("importance")) {
        delete data.importance;
      }
    },

    init: function (options) {
      this.model = options.model;
      this.model.on("change", _.bind(this.handleChange, this));
      Backbone.history.start();
      this.initialisedByUrl = !!this._setFromUrl;
    },

    handleChange: function () {
      var date = this.model.get("date");
      var center = this.model.get("center");
      var zoom = this.model.get("zoom");
      var query = this.model.get("query");
      var importance = this.model.get("importance");
      var filterState = this.model.get("filterState").toJSON();
      var highlight = this.model.get("highlight");
      var state = this.model.get("selectedEventId");
      var filters = "";
      var location = [
        "lat", center[0].toFixed(5),
        "lon", center[1].toFixed(5),
        "zoom", zoom,
        "start", date[0],
        "end", date[1],
        "importance", importance
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

          if (state) {

            location.push("state");
            location.push(state);

          }

        }
      }

      this.navigate(location.join("/"));

      this.sendAnalytics(center, zoom, date, importance);
    },

    sendAnalytics: _.debounce(function (center, zoom, date, importance) {
      analytics.navigation({
        lat: center[0],
        lon: center[1],
        zoom: zoom,
        start: parseInt(date[0], 10),
        end: parseInt(date[1], 10),
        importance: parseInt(importance, 10)
      });
    }, 500)

  });

  return Router;
});