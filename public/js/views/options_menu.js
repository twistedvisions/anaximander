define([
  "jquery",
  "underscore",
  "backbone",
  "./event_editor",
  "text!templates/options_menu.htm",
  "css!/css/options_menu"
], function ($, _, Backbone, EventEditor, template) {

  var OptionsMenu = Backbone.View.extend({
    className: "options-menu dropdown show",

    initialize: function (options) {      
      this.event = options.event;
    },

    render: function () {
      this.$el.html(template);
      this.$(".add-event").on("click", _.bind(this.handleAddEvent, this));

      this.$el.appendTo($("body")).css({
        left: this.event.pixel.x,
        top: this.event.pixel.y
      });
      return this.$el;
    },

    handleAddEvent: function () {
      new EventEditor().render();
      this.$el.remove();
    }

  });

  return OptionsMenu;
});