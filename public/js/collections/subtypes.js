define([
  "underscore",
  "backbone",
  "../models/type"
], function (_, Backbone, Type) {
  
  var types = Backbone.Collection.extend({
    
    model: Type,
    
    url: function () {
      return "type/" + this.parentType.get("id") + "/type";
    },

    initialize: function () {

    },

    setParentType: function (parentType) {
      this.parentType = parentType;
    }

  });
  return types;
});