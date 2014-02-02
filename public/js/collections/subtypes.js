define([
  "underscore",
  "backbone",
  "when",
  "models/type"
], function (_, Backbone, when, Type) {

  var types = Backbone.Collection.extend({

    model: Type,

    url: function () {
      return "type/" + this.parentType.get("id") + "/type";
    },

    initialize: function () {
      this.byParentType = {};
    },

    setParentType: function (parentType) {
      this.parentType = parentType;
    },

    getParentType: function () {
      return this.parentType;
    },

    updateData: function (opts) {
      var d = when.defer();
      var parentType = this.parentType.get("id");
      if (this.byParentType[parentType]) {
        this.reset(this.byParentType[parentType]);
        d.resolve();
      } else {
        opts.success = _.bind(function () {
          this.byParentType[parentType] = this.toJSON();
          d.resolve();
        }, this);
        this.fetch(opts);
      }
      return d.promise;
    }

  });
  return types;
});