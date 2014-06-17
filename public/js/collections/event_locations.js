define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "utils/filter_url_serialiser",
  "utils/date",
  "models/event_location"
], function ($, _, Backbone, when, FilterUrlSerialiser, date, EventLocation) {

  var Events = Backbone.Collection.extend({

    model: EventLocation,

    initialize: function (options) {
      this.state = options.state;
      this.queryPending = false;

      this.lastResults = [];
      this.lastInfoWindow = null;
    },

    start: function () {
      var changeEvents = ["center", "date", "bounds", "filterState", "importance"];
      var bindString = _.map(changeEvents, function (event) {
        return "change:" + event;
      }).join(" ");
      this.state.on(bindString, this.getDebouncedUpdateData(), this);
      _.bind(this.getDebouncedUpdateData(), this)();
    },

    //Need to do this to facilitate testing.
    getDebouncedUpdateData: function () {
      return _.debounce(this.updateData, 500);
    },

    updateData: function () {
      if (!this.queryPending) {
        this.queryPending = true;

        try {
          var position = this.state.get("center");
          var timeRange = this.state.get("date");
          var bounds = this.state.get("bounds");
          var filterState = this.state.get("filterState");
          var importance = this.state.get("importance");

          var params = {
            lat: position[0],
            lon: position[1],
            importance: importance,
            start: this.getStartOfYear(timeRange[0]),
            end: this.getEndOfYear(timeRange[1]),
            roleFilters: _.pluck(FilterUrlSerialiser.getRoleFilterKeys(filterState), "id"),
            eventTypeFilters: _.pluck(FilterUrlSerialiser.getEventTypeFilterKeys(filterState), "id"),
            typeFilters: JSON.stringify(FilterUrlSerialiser.getTypeFilterKeys(filterState, true)),
            subtypeFilters: JSON.stringify(FilterUrlSerialiser.getSubtypeFilterKeys(filterState, true)),
            notSpecifiedTypeFilters: JSON.stringify(FilterUrlSerialiser.getNotSpecifiedTypeFilterKeys(filterState, true))
          };


          var lon = position[1];

          if (!this.crossesAntiMeridian(lon, bounds)) {
            this.simpleQuery(bounds, params);
          } else {
            this.queryBothHemispheres(lon, bounds, params);
          }
        } catch (e) {
          this.queryPending = false;
          throw e;
        }

        this.timeoutQueryPending();
      }
    },

    queryPendingTimeout: 10 * 1000,

    timeoutQueryPending: function () {
      if (this.queryPending) {
        setTimeout(_.bind(function () {
          this.queryPending = false;
        }, this), this.queryPendingTimeout);
      }
    },

    crossesAntiMeridian: function (lon, bounds) {
      //bounds[0] is NE corner
      //bounds[1] is the SW corner
      return (bounds[0].lon < lon) || (bounds[1].lon > lon);
    },

    simpleQuery: function (bounds, params) {
      params.bounds = [
        [bounds[0].lat, bounds[0].lon],
        [bounds[1].lat, bounds[1].lon]
      ];

      $.get(
        "/location",
        params,
        _.bind(this.handleResults, this)
      );
    },

    queryBothHemispheres: function (lon, bounds, params) {
      var isLonPositive = lon > 0;

      var p1 = _.extend({bounds: [
        [bounds[0].lat, bounds[0].lon],
        [bounds[1].lat, -180]
      ]}, params);

      var p2 = _.extend({bounds: [
        [bounds[0].lat, 180],
        [bounds[1].lat, bounds[1].lon]
      ]}, params);

      if (isLonPositive) {
        p1.lon = -180;
      } else {
        p2.lon = 180;
      }

      when.all([
        $.get(
          "/location",
          p1
        ),
        $.get(
          "/location",
          p2
        )
      ]).then(_.bind(this.combineResults, this));
    },

    getStartOfYear: function (year) {
      return date.formatYearAsTimestamp(year, "-01-01 00:00");
    },

    getEndOfYear: function (year) {
      return date.formatYearAsTimestamp(year, "-12-31 23:59");
    },

    combineResults: function (results) {
      return this.handleResults(results[0].concat(results[1]));
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
        place_id: result[0].place_thing_id,
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
          return a > b ? 1 : (a === b ? 0 : -1);
        });
      });
      return locations;
    }

  });
  return Events;
});





