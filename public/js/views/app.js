define([
  "jquery",
  "jqueryui",
  "underscore",
  "backbone",
  "bootstrap",
  "libs/when",
  "collections/event_locations",
  "collections/types",
  "collections/subtypes",
  "collections/roles",
  "collections/event_types",
  "text!templates/layout.htm"
], function ($, jqueryui, _, Backbone, Bootstrap, when,
    EventLocationsCollection,
    TypeCollection, SubtypeCollection,
    RolesCollection, EventTypesCollection, layoutTemplate) {
  var AppView = Backbone.View.extend({
    el: "body",

    initialize: function (options) {
      this.eventLocationsCollection = new EventLocationsCollection({state: this.model});
      this.typesCollection = new TypeCollection();
      this.subtypesCollection = new SubtypeCollection();
      this.rolesCollection = new RolesCollection();
      this.eventTypesCollection = new EventTypesCollection();

      this.rolesCollection.fetch();
      this.eventTypesCollection.fetch();

      this.user = options.user;
    },

    render: function () {
      $(this.el).html(layoutTemplate);

      var typesLoaded = when.defer();
      var filtersLoaded = when.defer();
      this.typesCollection.fetch({
        success: function () {
          typesLoaded.resolve(true);
        },
        error: function () {
          typesLoaded.reject();
        }
      });

      require(["views/map"], _.bind(function (MapView) {
        this.mapView = new MapView({
          model: this.model,
          user: this.user,
          eventLocationsCollection: this.eventLocationsCollection
        });
        this.mapView.render();
      }, this));

      require(["views/search_box"], _.bind(function (SearchBoxView) {
        this.searchBoxView = new SearchBoxView({model: this.model});
        this.searchBoxView.render();
      }, this));

      require(["views/date_slider"], _.bind(function (DateSliderView) {
        this.dateSliderView = new DateSliderView({model: this.model});
        this.dateSliderView.render();
      }, this));

      require(["views/summary_text"], _.bind(function (SummaryTextView) {
        this.summaryTextView = new SummaryTextView({model: this.model});
        this.summaryTextView.render();
      }, this));

      require(["views/summary_bar"], _.bind(function (SummaryBar) {
        this.summaryBar = new SummaryBar({
          model: this.model,
          user: this.user,
          eventLocationsCollection: this.eventLocationsCollection
        });
        this.summaryBar.render();
      }, this));

      require(["views/filters"], _.bind(function (Filters) {
        this.filters = new Filters({
          model: this.model,
          typesCollection: this.typesCollection,
          subtypesCollection: this.subtypesCollection,
          rolesCollection: this.rolesCollection,
          eventTypesCollection: this.eventTypesCollection
        });
        filtersLoaded.resolve(true);
      }, this));
      when.all([typesLoaded.promise, filtersLoaded.promise])
          .then(_.bind(this.renderFilters, this));
    },
    renderFilters: function () {
      this.filters.render();
    }
  });
  return AppView;
});





