define([
  "jquery",
  "underscore",
  "backbone"
], function ($, _, Backbone) {

  var DateSliderView = Backbone.View.extend({
    el: "#slider-range",

    initialize: function (opts) {      
      
    },

    render: function () {
      this.slider = this.$el.slider({
        range: true,
        min: -2000,
        max: 2013,
        values: this.model.get("date"),
        slide: _.bind(function (event, ui) {
          window.lastEvent = "slider";
          this.model.set("date", this.getTimeRange());
        }, this)
      });

      this.model.on("change:date", this.update, this);
    },

    getTimeRange: function () {
      return [$("#slider-range").slider("values", 0), 
              $("#slider-range").slider("values", 1)];
    },

    update: function () {
      this.slider.slider({
        values: this.model.get("date")
      });
    }
  });

  return DateSliderView;
});