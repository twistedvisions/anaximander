define([
  "backbone"
], function (Backbone) {
  var Event = Backbone.Model.extend({
    url: "/event"
  });
  return Event;
});