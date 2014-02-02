define([
  "underscore",
  "backbone",
  "models/role",
  "utils/underscore_string"
], function (_, Backbone, Role) {

  var Roles = Backbone.Collection.extend({
    model: Role,
    url: "role",
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