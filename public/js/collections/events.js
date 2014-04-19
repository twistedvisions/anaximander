define([
  "underscore",
  "backbone",
  "models/event"
], function (_, Backbone, Event) {

  var events = Backbone.Collection.extend({

    url: "/event",
    model: Event,

    initialize: function () {
    }

  });
  return events;
});