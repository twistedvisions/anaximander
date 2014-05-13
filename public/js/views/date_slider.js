define([
  "jquery",
  "underscore",
  "backbone",
  "range-slider",
  "less!/css/rangeslider",
  "less!/css/date_slider"
], function ($, _, Backbone) {

  var DateSliderView = Backbone.View.extend({
    el: "#slider-range",

    initialize: function () {
    },

    render: function () {
      this.$el.html("<div class='slider'></div>");
      var date = this.model.get("date");

      this.$(".slider").rangeSlider({ //dateRangeSlider({
        bounds: {
          min: -2000, //new Date(-2000, 0, 1),
          max: new Date().getFullYear() //new Date(),
        },
        defaultValues: {
          min: date[0],
          max: date[1]
        },
        type: "double",
        valueLabels: "hide",
        arrows: false
      });
      this.$(".slider").on("valuesChanging", _.bind(this.sliderChanged, this));

      this.model.on("change:date", this.update, this);
      // this.showDate();
    },

    sliderChanged: function (event, data) {
      window.lastEvent = "slider";
      var timeRange = this.getTimeRange(data);
      this.model.set("date", timeRange);
      // this.showDate();
    },

    showDate: function () {
      var timeRange = this.model.get("date");
      this.$(".ui-rangeSlider-leftHandle").text(this.toText(timeRange[0], timeRange[1]));
      this.$(".ui-rangeSlider-rightHandle").text(this.toText(timeRange[1], timeRange[0]));
    },

    getTimeRange: function (data) {
      return [Math.round(data.values.min), Math.round(data.values.max)];
    },

    update: function () {
      var date = this.model.get("date");
      var currentPos = this.$(".slider").rangeSlider("values");

      if (Math.round(currentPos.min) !== date[0] ||
          Math.round(currentPos.max, 10) !== date[1]) {
        this.$(".slider").rangeSlider("values", date[0], date[1]);
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