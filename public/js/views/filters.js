define([
  "jquery",
  "underscore",
  "backbone",
  "fuse",
  "analytics",
  "views/filters/primary_filters",
  "views/filters/secondary_filters",
  "text!templates/filters.htm",
  "text!templates/filter.htm",
  "css!/css/filters"
], function ($, _, Backbone, Fuse, analytics,
    PrimaryFilters, SecondaryFilters,
    template, filterTemplate) {

  var Filters = Backbone.View.extend({
    el: "#filters-container",

    initialize: function (opts) {
      this.typesCollection = opts.typesCollection;
      this.subtypesCollection = opts.subtypesCollection;
      this.filterTemplate =  _.template(filterTemplate);
      this.primaryFilters = new PrimaryFilters({
        typesCollection: this.typesCollection,
        model: this.model
      });
      this.secondaryFilters = new SecondaryFilters({
        subtypesCollection: this.subtypesCollection,
        model: this.model
      });
      this.typesCollection.on("highlightChanged", function (thingType) {
        this.secondaryFilters.showSecondaryFilters(thingType);
      }, this);
      this.typesCollection.on("selectionChanged", function (thingType, isSelected) {
        this.primaryFilterSelectionChanged(thingType, isSelected);
      }, this);
      this.model.on("change:filterState", function () {
        if (this.lastPrimarySelected) {
          this.showSecondaryFilters(this.lastPrimarySelected);
        }
      }, this);
    },

    primaryFilterSelectionChanged: function (filter, isChecked) {
      var id = filter.get("id");
      //can do this silently because secondary will trigger
      if (isChecked) {
        this.model.removeFilterStateKey(id, null, true);
      } else {
        this.model.addFilterStateKey(id, null, true);
      }
      this.subtypesCollection.setParentType(filter);
      this.subtypesCollection.updateData({reset: true}).then(_.bind(function () {
        this.secondaryFilters.setSecondaries(id);
      }, this));
      this.model.trigger("change:filterState");
    },

    render: function () {
      this.$el.html(template);
      this.primaryFilters.render().appendTo(this.$(".primary"));
      this.secondaryFilters.render().appendTo(this.$(".secondary"));

      return this.$el;
    }
  });

  return Filters;
});