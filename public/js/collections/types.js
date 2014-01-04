define([
  "underscore",
  "backbone",
  "models/type"
], function (_, Backbone, Type) {

  var types = Backbone.Collection.extend({

    model: Type,

    url: "/type",

    initialize: function () {

    }

  });
  return types;
});