define([
  "jquery",
  "underscore",
  "backbone",
  "./range_slider",
  "less!../../css/date_slider"
], function ($, _, Backbone, RangeSlider) {

  var DateSliderView = Backbone.View.extend({
    el: "#slider-range",

    initialize: function () {
      this.min = -2000;
      this.max = new Date().getFullYear() + 1;
    },

    render: function () {
      this.$el.html("<div class='slider-holder'></div>");
      var date = this.model.get("date");
      this.slider = new RangeSlider({
        el: ".slider-holder",
        min: this.min,
        max: this.max,
        state: {
          min: date[0],
          max: date[1]
        }
      });
      this.slider.render();
      this.slider.on("update", this.sliderChanged, this);
      this.model.on("change:date", this.update, this);
      this.showDate();
    },

    sliderChanged: function (data) {
      window.lastEvent = "date-slider";
      var timeRange = this.getTimeRange(data);
      this.model.set("date", timeRange);
      this.showDate();
    },

    showDate: function () {
      var timeRange = this.model.get("date");
      var minSlider, maxSlider;

      if (parseInt(this.$(".slider-a").css("left"), 10) <= parseInt(this.$(".slider-b").css("left"), 10)) {
        minSlider = this.$(".slider-a .text");
        maxSlider = this.$(".slider-b .text");
      } else {
        minSlider = this.$(".slider-b .text");
        maxSlider = this.$(".slider-a .text");
      }
      minSlider.text(this.toText(timeRange[0], timeRange[1]));
      maxSlider.text(this.toText(timeRange[1], timeRange[0]));
    },

    getTimeRange: function (data) {
      return [
        data.min,
        data.max
      ];
    },

    update: function () {
      var date = this.model.get("date");
      var currentPos = this.slider.getState();

      if ((Math.round(currentPos.min) !== date[0]) ||
          (Math.round(currentPos.max, 10) !== date[1])) {
        this.slider.setState(date[0], date[1]);
        this.slider.redraw();
        this.showDate();
      }
    },

    toText: function (year, otherYear) {
      if (year <= 0) {
        return (-(year - 1)) + "BCE";
      } else if (otherYear !== undefined && otherYear <= 0) {
        return year + "CE";
      }
      return year.toString();
    }
  });

  return DateSliderView;
});