define([
  "jquery",
  "underscore",
  "backbone",
  "fuse",
  "analytics",
  "text!templates/filters-primary.htm",
  "text!templates/filter.htm"
], function ($, _, Backbone, Fuse, analytics, template, filterTemplate) {

  var PrimaryFilters = Backbone.View.extend({
    initialize: function (opts) {
      this.typesCollection = opts.typesCollection;
      this.filterTemplate =  _.template(filterTemplate);
    },

    render: function () {
      this.$el.html(template);
      this.primaryOptions = this.$(".options");
      this.updatePrimaryFilters();

      this.model.on("change:filterState", function () {
        this.updatePrimaryFilters();
      }, this);

      return this.$el;
    },

    updatePrimaryFilters: function () {
      this.primaryOptions.html("");
      this.typesCollection.forEach(this.renderPrimaryFilter, this);
    },

    renderPrimaryFilter: function (thingType) {
      var json = thingType.toJSON();
      json.isUnset = this.model.filterStateExists(json.id);
      var id = thingType.get("id");
      json.isHalfSet = this.model.isPrimaryFilterStateUsed(id);
      json.not_specified = false;

      var el = $(this.filterTemplate(json));
      this.primaryOptions.append(el);

      el.hover(_.bind(this.updateHighlightedPrimary, this, thingType));
      el.find("input[type=checkbox]").on("change", _.bind(function (event) {
        analytics.filterEventsByPrimary(json);
        var input = $(event.currentTarget);
        input.removeClass("half");
        this.updateSelectedPrimary(thingType, input.prop("checked"));
      }, this));
    },

    updateHighlightedPrimary: function (thingType) {
      this.$(".primary .filter").removeClass("selected");
      this.$(".primary .filter[data-id=" + thingType.get("id") + "]").addClass("selected");
      this.typesCollection.setHighlighted(thingType);
    },

    updateSelectedPrimary: function (thingType, isSelected) {
      this.typesCollection.setSelected(thingType, isSelected);
    }

  });

  return PrimaryFilters;
});