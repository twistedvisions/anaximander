define([
  "underscore",
  "backbone",
  "models/event"
], function (_, Backbone, Event) {
  
  var events = Backbone.Collection.extend({
    
    model: Event,

    initialize: function () {
    }

  });
  return events;
});