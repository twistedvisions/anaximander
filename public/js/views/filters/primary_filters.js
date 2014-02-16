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

    specialFilters: new Backbone.Collection([
      {
        id: "et",
        name: "are of type&hellip;",
        special: true
      },
      {
        id: "r",
        name: "have participants as&hellip;",
        special: true
      }
    ]),

    initialize: function (opts) {
      this.typesCollection = opts.typesCollection;
      this.filterTemplate =  _.template(filterTemplate);
    },

    render: function () {
      this.$el.html(template);
      this.primaryOptions = this.$(".options");
      this.updatePrimaryFilters();

      window.lastEvent = "filterChange";
      this.model.on("change:filterState", function () {
        this.updatePrimaryFilters();
      }, this);

      this.model.on("filter-view-change", function () {
        this.selectedId = null;
        if (this.$(":visible").length) {
          this.updatePrimaryFilters();
        }
      }, this);

      return this.$el;
    },

    updatePrimaryFilters: function () {
      this.primaryOptions.html("");
      this.specialFilters.forEach(this.renderPrimaryFilter, this);
      this.typesCollection.forEach(this.renderPrimaryFilter, this);
    },

    renderPrimaryFilter: function (thingType) {
      var json = thingType.toJSON();
      json.isUnset = this.model.filterStateExists(json.id);
      var id = thingType.get("id");
      json.isHalfSet = this.model.isPrimaryFilterStateUsed(id);
      json.not_specified = false;
      json.special = !!thingType.get("special") || false;
      json.isSelected = thingType.id === this.selectedId;
      var el = $(this.filterTemplate(json));
      this.$(".options." + (json.special ? "special" : "type")).append(el);
      el.hover(_.bind(this.updateHighlightedPrimary, this, thingType));
      el.find("input[type=checkbox]").on("change",
        _.bind(this.checkboxClicked, this, json, thingType));
      el.find(".name").on("click", _.bind(this.nameClicked, this, json, thingType));
      el.on("click", _.bind(this.filterClicked, this, json, thingType));
    },

    updateHighlightedPrimary: function (thingType) {
      this.$(".primary .filter").removeClass("selected");
      this.$(".primary .filter[data-id=" + thingType.get("id") + "]").addClass("selected");
      this.typesCollection.setHighlighted(thingType);
    },

    filterClicked: function (json, thingType/*, event*/) {
      // analytics.filterPrimaryClicked(json);
      if (this.selectedId === thingType.id) {
        this.selectedId = null;
        this.updatePrimaryFilters();
        this.typesCollection.setSelected(null, null);
      } else {
        this.updateSelectedPrimary(thingType, null);
      }
    },

    checkboxClicked: function (json, thingType, event) {
      this.filterCheckboxClicked(json, thingType, event,
        $(event.currentTarget));
    },

    nameClicked: function (json, thingType, event) {
      var input = $(event.currentTarget).parent().find("input");
      input.prop("checked", !input.prop("checked"));
      this.filterCheckboxClicked(json, thingType, event,
        input);
    },

    filterCheckboxClicked: function (json, thingType, event, input) {
      analytics.filterEventsByPrimary(json);
      input.removeClass("half");
      this.updateSelectedPrimary(thingType, input.prop("checked"));
    },

    updateSelectedPrimary: function (thingType, isSelected) {
      this.selectedId = thingType.id;
      this.typesCollection.setSelected(thingType, isSelected);
    }

  });

  return PrimaryFilters;
});