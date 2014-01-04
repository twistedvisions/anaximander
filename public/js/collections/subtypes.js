define([
  "underscore",
  "backbone",
  "models/type"
], function (_, Backbone, Type) {

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
      var success = opts.success;
      var parentType = this.parentType.get("id");
      if (this.byParentType[parentType]) {
        this.reset(this.byParentType[parentType]);
        success();
      } else {
        opts.success = _.bind(function () {
          this.byParentType[parentType] = this.toJSON();
          success();
        }, this);
        return this.fetch(opts);
      }
    }

  });
  return types;
});