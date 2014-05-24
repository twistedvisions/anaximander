define([
  "jquery",
  "underscore",
  "backbone",
  "text!templates/importance_slider.htm",
  "less!../../css/importance_slider"
], function ($, _, Backbone, template) {

  var ImportanceSlider = Backbone.View.extend({
    el: "#importance-slider-container",

    initialize: function () {

    },

    render: function () {

      this.$el.html(template);
      $("#importance-slider").slider({
        orientation: "vertical",
        min: 0,
        max: 1000,
        value: this.getValue(this.model.get("importance")),
        slide: _.bind(this.handleSlide, this)
      });

      this.model.on("change:importance", this.update, this);

    },

    update: function () {
      $("#importance-slider").slider({
        value: this.getValue(this.model.get("importance"))
      });
    },

    getValue: function (value) {
      return Math.round(Math.pow(value, 1.0 / 3) * 100);
    },

    handleSlide: function (e, ui) {
      var value = ui.value / 100.0;
      var actual = value * value * value;
      this.model.set("importance", Math.ceil(actual));
    }

  });

  return ImportanceSlider;
});