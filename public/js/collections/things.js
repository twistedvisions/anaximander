define([
  "underscore",
  "backbone",
  "models/thing"
], function (_, Backbone, Thing) {

  var things = Backbone.Collection.extend({

    url: "/thing",
    model: Thing,

    initialize: function () {
    }

  });
  return things;
});