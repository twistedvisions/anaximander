define([
  "underscore",
  "backbone",
  "models/event_type",
  "underscore_string"
], function (_, Backbone, EventType) {

  var EventTypes = Backbone.Collection.extend({
    model: EventType,
    url: "event_type",

    parse: function (results) {
      results = _.map(results, function (x) {
        x.name = _.string.capitalize(x.name);
        return x;
      });
      return results;
    }
  });

  return EventTypes;
});