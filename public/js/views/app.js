define([
  "jquery",
  "jqueryui",
  "underscore",
  "backbone",
  "text!templates/layout.html"
], function ($, jqueryui, _, Backbone, layoutTemplate) {
  var AppView = Backbone.View.extend({
    el: "body",
    
    initialize: function () {

    },

    render: function () {
      $(this.el).html(layoutTemplate);

      require(["views/map"], _.bind(function (MapView) {
        var mapView = new MapView({model: this.model});
        mapView.render();
      }, this));


      require(["views/date_slider"], _.bind(function (DateSliderView) {
        var dateSliderView = new DateSliderView({model: this.model});
        dateSliderView.render();
      }, this));

      this.model.on("change:date", this.setSummaryText, this);
      this.setSummaryText();
    },
      
    setSummaryText: function () {

      var timeRange = this.model.get("date");

      $("#info-panel").text(this.toText(timeRange[0]) + " - " +
                            this.toText(timeRange[1], timeRange[0]));
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
  return AppView;
});





