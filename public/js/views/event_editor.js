define([
  "jquery",
  "underscore",
  "backbone",
  "text!templates/event_editor.htm",
  "css!/css/event_editor"
], function ($, _, Backbone, template) {

  var EventEditor = Backbone.View.extend({
    className: "",

    initialize: function () {      
      
    },

    render: function () {
      this.$el.html(template);
      $("body").append(this.$el);
      this.$el.find(".modal").modal();
      this.$el.find(".modal").modal("show");
      return this.$el;
    }

  });

  return EventEditor;

});