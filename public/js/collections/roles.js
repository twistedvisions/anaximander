define([
  "underscore",
  "backbone",
  "models/role",
  "underscore_string"
], function (_, Backbone, Role) {

  var Roles = Backbone.Collection.extend({
    model: Role,
    url: function () {
      return "role/" + this.eventTypeId;
    },
    setEventType: function (eventTypeId) {
      if (eventTypeId === this.eventTypeId) {
        return false;
      } else {
        this.eventTypeId = eventTypeId;
        return true;
      }
    },
    getEventType: function () {
      return this.eventTypeId;
    },
    parse: function (results) {
      results = _.map(results, function (x) {
        x.name = _.string.capitalize(x.name);
        return x;
      });
      return results;
    }
  });

  return Roles;
});