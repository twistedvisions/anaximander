define([
  "underscore",
  "backbone",
  "when",
  "models/type"
], function (_, Backbone, when, Type) {

  var types = Backbone.Collection.extend({

    model: Type,

    url: function () {
      return "type/" + this.parentTypeId + "/type";
    },

    initialize: function () {
      this.byParentType = {};
    },

    updateData: function (opts) {
      var d = when.defer();

      this.parentTypeId = opts.id;
      if (this.byParentType[this.parentTypeId]) {
        this.reset(this.byParentType[this.parentTypeId]);
        d.resolve();
      } else {
        opts.success = _.bind(function () {
          this.byParentType[this.parentTypeId] = this.toJSON();
          d.resolve();
        }, this);
        this.fetch(opts);
      }
      return d.promise;
    },

    parse: function (results) {
      results = _.map(results, function (x) {
        x.name = _.string.capitalize(x.name);
        return x;
      });
      return results;
    }

  });
  return types;
});