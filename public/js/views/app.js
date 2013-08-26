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

      require(["views/summary_text"], _.bind(function (SummaryTextView) {
        var summaryTextView = new SummaryTextView({model: this.model});
        summaryTextView.render();
      }, this));
    }
  });
  return AppView;
});





