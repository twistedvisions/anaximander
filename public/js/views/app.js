define([
  "jquery",
  "jqueryui",
  "underscore",
  "backbone",
  "models/view_state",
  "text!templates/layout.html"
], function ($, jqueryui, _, Backbone, ViewState, layoutTemplate) {
  var AppView = Backbone.View.extend({
    el: "body",
    
    initialize: function () {
      this.model = new ViewState({
        date: [1813, 2013],
        center: [53.24112905344493, 6.191539001464932],
        zoom: 9,
        radius: 10
      });
    },

    render: function () {
      $(this.el).html(layoutTemplate);

      this.renderSlider();

      require(["views/map"], _.bind(function (MapView) {
        var mapView = new MapView({model: this.model});
        mapView.render();
      }, this));

      this.model.on("change:date", this.setSummaryText, this);
      this.setSummaryText();
    },

    renderSlider: function () {
      $("#slider-range").slider({
        range: true,
        min: -4000,
        max: 2013,
        values: this.model.get("date"),
        slide: _.bind(function( event, ui ) {
          this.model.set("date", this.getTimeRange());
        }, this)
      });
    },

    getTimeRange: function () {
      return [$("#slider-range").slider("values", 0), 
              $("#slider-range").slider("values", 1)];
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





