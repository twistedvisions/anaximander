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
        min: this.convertToRatio(date[0]),
        max: this.convertToRatio(date[1])
      });
      this.slider.render();
      this.slider.on("update", this.sliderChanged, this);
      this.model.on("change:date", this.update, this);
      this.showDate();
    },

    convertToRatio: function (x) {
      return (x - this.min) / (this.max - this.min);
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
      if (parseInt(this.$(".slider-a").css("left"), 10) < parseInt(this.$(".slider-b").css("left"), 10)) {
        minSlider = this.$(".slider-a");
        maxSlider = this.$(".slider-b");
      } else {
        minSlider = this.$(".slider-b");
        maxSlider = this.$(".slider-a");
      }
      minSlider.text(this.toText(timeRange[0], timeRange[1]));
      maxSlider.text(this.toText(timeRange[1], timeRange[0]));
    },

    getTimeRange: function (data) {
      var range = this.max - this.min;
      return [
        parseInt((data.min * range) + this.min, 10),
        parseInt((data.max * range) + this.min, 10)
      ];
    },

    update: function () {
      var date = this.model.get("date");
      var currentPos = this.slider.getState();

      if (Math.round(currentPos.min) !== this.convertToRatio(date[0]) ||
          Math.round(currentPos.max, 10) !== this.convertToRatio(date[1])) {
        this.slider.setState(this.convertToRatio(date[0]), this.convertToRatio(date[1]));
      }
    },

    toText: function (year, otherYear) {
      if (year < 0) {
        return (-year) + "BCE";
      } else if (otherYear && otherYear < 0) {
        return year + "CE";
      }
      return year;
    }
  });

  return DateSliderView;
});