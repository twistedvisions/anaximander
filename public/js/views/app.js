define([
  "jquery",
  "jqueryui",
  "underscore",
  "backbone",
  "../collections/events",
  "text!templates/layout.htm"
], function ($, jqueryui, _, Backbone, EventCollection, layoutTemplate) {
  var AppView = Backbone.View.extend({
    el: "body",
    
    initialize: function () {
      this.eventsCollection = new EventCollection({state: this.model});
    },

    render: function () {
      $(this.el).html(layoutTemplate);

      require(["views/map"], _.bind(function (MapView) {
        var mapView = new MapView({
          model: this.model,
          eventsCollection: this.eventsCollection
        });
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

      require(["views/summary_bar"], _.bind(function (SummaryBar) {
        var summaryBar = new SummaryBar({
          model: this.model,
          eventsCollection: this.eventsCollection
        });
        summaryBar.render();
      }, this));

      require(["views/filters"], _.bind(function (Filters) {
        var filters = new Filters({
          model: this.model,
          eventsCollection: this.eventsCollection
        });
        filters.render();
      }, this));
    }
  });
  return AppView;
});





