define([
  "jquery",
  "underscore",
  "backbone",
  "../utils/filter_url_serialiser",
  "../models/event"
], function ($, _, Backbone, FilterUrlSerialiser, Event) {
  
  var Events = Backbone.Collection.extend({
    
    model: Event,

    initialize: function (options) {
      this.state = options.state;
      this.queryPending = false;

      this.lastResults = [];
      this.lastInfoWindow = null;
      
      this.state.on("change", _.debounce(this.updateData, 500), this);
    },

    updateData: function () {
      if (!this.queryPending) {
        this.queryPending = true;
        var position = this.state.get("center");
        var timeRange = this.state.get("date");
        var radius = this.state.get("radius");
        var filterState = this.state.get("filterState");
        var pad = function (n, width, z) {
          z = z || "0";
          n = n + "";
          return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
        };
        var formatYear = function (year) {
          return pad(Math.abs(year), 4, 0);
        };
        var getStartOfYear = function (year) {
          return formatYearAsTimestamp(year, "-01-01 00:00");
        };
        var getEndOfYear = function (year) {
          return formatYearAsTimestamp(year, "-12-31 23:59");
        };
        var formatYearAsTimestamp = function (year, suffix) {
          var isBc = year < 0;
          year = formatYear(year) + suffix + (isBc ? " BC" : "");
          return isBc ? year.substring(1) : year;
        };
        $.get(
          "/location", 
          {
            lat: position[0], 
            lon: position[1], 
            radius: radius,
            start: getStartOfYear(timeRange[0]), 
            end: getEndOfYear(timeRange[1]),
            typeFilters: JSON.stringify(FilterUrlSerialiser.getTypeFilterKeys(filterState)),
            subtypeFilters: JSON.stringify(FilterUrlSerialiser.getSubtypeFilterKeys(filterState)),
            notSpecifiedTypeFilters: JSON.stringify(FilterUrlSerialiser.getNotSpecifiedTypeFilterKeys(filterState))
          }, 
          _.bind(this.handleResults, this)
        );
      }
    },

    handleResults: function (results) {
      this.queryPending = false;
      results = this.combineEventsAtTheSamePlace(_.cloneDeep(results));

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
      this.lastResults = results;

      this.trigger("reset", [toRemove, toRender]);

    },

    makeKey: function (result) {
      return JSON.stringify({
        location: result[0].location[0],
        events: _.map(result, function (r) {
          return r;
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





