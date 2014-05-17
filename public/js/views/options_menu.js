define([
  "jquery",
  "underscore",
  "backbone",
  "views/event_editor",
  "analytics",
  "text!templates/options_menu.htm",
  "less!../../css/options_menu"
], function ($, _, Backbone, EventEditor, analytics, template) {

  var OptionsMenu = Backbone.View.extend({
    className: "options-menu dropdown show",

    initialize: function (options) {
      this.event = options.event;
      this.parent = options.parent;
    },

    render: function () {
      this.$el.html(template);
      this.$(".add-event").on("click", _.bind(this.handleAddEvent, this));
      if (this.event) {
        var parentPosition = this.parent.position();
        this.$el.appendTo($("body")).css({
          left: this.event.pixel.x + parentPosition.left,
          top: this.event.pixel.y + parentPosition.top
        });
      }
      return this.$el;
    },

    handleAddEvent: function (e) {
      e.preventDefault();
      this.showEventEditor();
      analytics.optionSelected({option: "addEvent"});
      this.close();
    },

    showEventEditor: function () {
      new EventEditor({
        state: this.model,
        newEvent: {
          location: {
            lat: this.event.latLng.lat(),
            lon: this.event.latLng.lng()
          }
        }
      }).render();
    },

    close: function () {
      this.$el.remove();
    }

  });

  return OptionsMenu;
});