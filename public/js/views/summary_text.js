define([
  "jquery",
  "underscore",
  "backbone",
  "css!/css/summary_text"
], function ($, _, Backbone) {

  var SummaryTextView = Backbone.View.extend({
    el: "#info-panel",

    initialize: function () {

    },

    render: function () {

      this.model.on("change:date", this.updateText, this);
      this.updateText();
    },

    updateText: function () {
      var timeRange = this.model.get("date");

      this.$el.text([
        this.toText(timeRange[0]),
        this.toText(timeRange[1], timeRange[0])
      ].join(" - "));
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

  return SummaryTextView;
});