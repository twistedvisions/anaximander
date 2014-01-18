define([
  "jquery",
  "underscore",
  "backbone",
  "utils/filter_url_serialiser",
  "models/event_location"
], function ($, _, Backbone, FilterUrlSerialiser, EventLocation) {

  var Events = Backbone.Collection.extend({

    model: EventLocation,

    initialize: function (options) {
      this.state = options.state;
      this.queryPending = false;

      this.lastResults = [];
      this.lastInfoWindow = null;
    },

    start: function () {
      this.state.on("change", _.debounce(this.updateData, 500), this);
    },

    updateData: function () {
      if (!this.queryPending) {
        this.queryPending = true;
        var position = this.state.get("center");
        var timeRange = this.state.get("date");
        var bounds = this.state.get("bounds");
        var filterState = this.state.get("filterState");

        $.get(
          "/location",
          {
            lat: position[0],
            lon: position[1],
            bounds: bounds,
            start: this.getStartOfYear(timeRange[0]),
            end: this.getEndOfYear(timeRange[1]),
            typeFilters: JSON.stringify(FilterUrlSerialiser.getTypeFilterKeys(filterState)),
            subtypeFilters: JSON.stringify(FilterUrlSerialiser.getSubtypeFilterKeys(filterState)),
            notSpecifiedTypeFilters: JSON.stringify(FilterUrlSerialiser.getNotSpecifiedTypeFilterKeys(filterState))
          },
          _.bind(this.handleResults, this)
        );
      }
    },

    getStartOfYear: function (year) {
      return this.formatYearAsTimestamp(year, "-01-01 00:00");
    },

    getEndOfYear: function (year) {
      return this.formatYearAsTimestamp(year, "-12-31 23:59");
    },

    //TODO: refactor out these into a different utils file
    formatYearAsTimestamp: function (year, suffix) {
      var isBc = year < 0;
      year = this.formatYear(year) + suffix + (isBc ? " BC" : "");
      return isBc ? year.substring(1) : year;
    },

    formatYear: function (year) {
      return this.pad(Math.abs(year), year < 0 ? 5 : 4, 0);
    },

    pad: function (n, width, z) {
      z = z || "0";
      n = n + "";
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },

    handleResults: function (results) {
      this.queryPending = false;
      results = this.combineEventsAtTheSamePlace(_.cloneDeep(results));

      var oldResultsAsKeys = _.map(this.lastResults, this.makeKey, this);
      var newResultsAsKeys = _.map(results, this.makeKey, this);
      var toRemove = _.difference(oldResultsAsKeys, newResultsAsKeys);
      var toRender = _.difference(newResultsAsKeys, oldResultsAsKeys);

      //todo: be better off storing last results as keys
      //so don't need to make it twice?
      this.lastResults = results;

      this.trigger("reset", [toRemove, toRender]);

    },

    makeKey: function (result) {
      return JSON.stringify({
        location: result[0].location[0],
        events: _.map(result, function (r) {
          return _.omit(r, "distance");
        })
      });
    },

    combineEventsAtTheSamePlace: function (results) {

      var locations = {};
      _.each(results, function (result) {
        var location = JSON.stringify(result.location[0]);
        locations[location] = locations[location] || [];
        locations[location].push(result);
      });
      locations = _.values(locations);
      _.each(locations, function (location) {
        location.sort(function (a, b) {
          a = new Date(a.start_date).getTime();
          b = new Date(b.start_date).getTime();
          return (a - b) / Math.abs(a - b);
        });
      });
      return locations;
    }

  });
  return Events;
});





