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
  "less!/css/filters"
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
        rolesCollection: opts.rolesCollection,
        eventTypesCollection: opts.eventTypesCollection,
        model: this.model
      });
      this.typesCollection.on("highlightChanged", function (thingType) {
        if (!this.selectedId) {
          this.secondaryFilters.showSecondaryFilters(thingType);
        }
      }, this);
      this.typesCollection.on("selectionChanged", function (thingType, isSelected) {
        var oldSelection = this.selectedId;
        this.selectedId = thingType ? thingType.id : null;
        if (thingType) {
          this.secondaryFilters.showSecondaryFilters(thingType);
          this.primaryFilterSelectionChanged(thingType, isSelected);

          if (oldSelection !== this.selectedId) {
            analytics.selectPrimary(thingType.toJSON());
          }
        } else {
          analytics.unselectPrimary({id: oldSelection});
        }
      }, this);
      this.model.on("change:filterState", function () {
        if (this.lastPrimarySelected) {
          this.showSecondaryFilters(this.lastPrimarySelected);
        }
      }, this);
      this.model.on("filter-view-change", function () {
        this.selectedId = null;
      }, this);
    },

    primaryFilterSelectionChanged: function (filter, isChecked) {
      var id = filter.get("id");
      //can do this silently because secondary will trigger
      if (isChecked === true) {
        this.model.removeFilterStateKey(id, null, true);
      } else if (isChecked === false) {
        this.model.addFilterStateKey(id, null, true);
      }
      if (_.isString(filter.id)) {
        this.secondaryFilters.setSecondaries(id);
      } else {
        this.subtypesCollection.updateData({reset: true, id: filter.id}).then(_.bind(function () {
          this.secondaryFilters.setSecondaries(id);
        }, this));
      }

      window.lastEvent = "filterChange";
      this.model.trigger("change:filterState");
    },

    render: function () {
      this.$el.html(template);
      this.primaryFilters.render().appendTo(this.$(".primary"));
      this.secondaryFilters.render().appendTo(this.$(".secondary"));

      return this.$el;
    },

    hide: function () {
      this.selectedId = null;
    }
  });

  return Filters;
});