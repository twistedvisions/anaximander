define([
  "jquery",
  "underscore",
  "backbone",
  "text!templates/filters.htm",
  "text!templates/filter.htm"
], function ($, _, Backbone, template, filterTemplate) {

  var Filters = Backbone.View.extend({
    el: "#filters-container",

    initialize: function (opts) {      
      this.eventsCollection = opts.eventsCollection;
      this.typesCollection = opts.typesCollection;
      this.subtypesCollection = opts.subtypesCollection;
    },

    render: function () {
      this.$el.html(template);
      this.updatePrimaryFilters();
      return this.$el;
    },

    updatePrimaryFilters: function () {
      var primary = this.$(".primary .options");
      primary.html("");
      var template =  _.template(filterTemplate);
      this.typesCollection.forEach(function (filter) {
        var json = filter.toJSON();
        json.isUnset = this.filterStateExists(json.id);
        var id = filter.get("id");
        json.isHalfSet = this.isPrimaryFilterStateUsed(id);
        json.not_specified = false;
        var el = $(template(json));
        primary.append(el);
        el.hover(_.bind(this.showSecondaryFilters, this, filter));
        el.find("input").on("change", _.bind(function (event) {
          var input = $(event.currentTarget);
          this.checkPrimary(filter, input.prop("checked"));
          input.removeClass("half");
        }, this));
      }, this);
    },

    checkPrimary: function (filter, isChecked) {
      var id = filter.get("id");
      if (isChecked) {
        this.removeFilterStateKey(id);
      } else {
        this.addFilterStateKey(id);
      }
      this.subtypesCollection.setParentType(filter);
      this.subtypesCollection.fetch({
        reset: true,
        success: _.bind(this._setSecondaries, this, isChecked)
      });
    },

    _setSecondaries: function (isChecked) {
      this.subtypesCollection.forEach(function (filter) {
        this.removeFilterStateKey(filter.get("id"));
      }, this);
      this._showSecondaryFilters();
    },

    showSecondaryFilters: function (filter) {
      var secondary = this.$(".secondary .options");
      secondary.html("");
      this.subtypesCollection.setParentType(filter);

      this.subtypesCollection.fetch({
        reset: true,
        success: _.bind(this._showSecondaryFilters, this)
      });
    },

    _showSecondaryFilters: function () {
      var template =  _.template(filterTemplate);
      var secondary = this.$(".secondary .options");
      secondary.html("");
      var parentTypeId = this.subtypesCollection.getParentType().get("id");
      var isParentUnselected = this.filterStateExists(parentTypeId);
      this._showSecondaryFilter(isParentUnselected, secondary, template, new Backbone.Model({
        id: -parentTypeId,
        name: "Not Specified",
        not_specified: true
      }));
      this.subtypesCollection.forEach(
        _.bind(this._showSecondaryFilter, 
          this, isParentUnselected, secondary, template)
      );
    },

    _showSecondaryFilter: function (isParentUnselected, secondary, template, filter) {
      var json = filter.toJSON();
      json.isUnset = isParentUnselected || this.filterStateExists(json.id);
      json.isHalfSet = false;
      json.not_specified = json.not_specified === true || json.not_specified === false;
      var el = $(template(json));
      secondary.append(el);
      el.find("input").on("change", _.bind(this.checkSecondary, this, filter));
    },

    checkSecondary: function (filter, event) {
      this.updateFilterState(filter, $(event.currentTarget).prop("checked"));

      //todo: only update the one
      this.updatePrimaryFilters();
    },

    updateFilterState: function (filter, checked) {
      var id = filter.get("id");  
      if (checked) {
        this.removeFilterStateKey(id);
      } else {
        this.addFilterStateKey(id, filter.get("parent_type"));
      }

      if (this.allSecondariesUnchecked()) {
        this.switchAllSecondarysForPrimary();
      } else {
        this.setRemainingSecondaryFilters();
      }
    },

    allSecondariesUnchecked: function () {
      return this.subtypesCollection.all(function (subtype) {
        return this.filterStateExists(subtype.get("id"));
      }, this);
    },
    switchAllSecondarysForPrimary: function () {
      this.subtypesCollection.forEach(function (subtype) {
        this.removeFilterStateKey(subtype.get("id"));
      }, this);

      this.addFilterStateKey(this.getParentTypeId());
    },
    setRemainingSecondaryFilters: function () {
      var parentTypeId = this.getParentTypeId();
      this.removeFilterStateKey(parentTypeId);
      this.$el.find(".secondary input").each(_.bind(function (i, el) {
        var $el = $(el);
        var id = parseInt($el.attr("data-id"), 10);
        if (!$el.prop("checked")) {
          this.addFilterStateKey(id, parentTypeId);
        }
      }, this));
    },

    getFilterState: function (id) {
      return this.model.get("filterState").get(id);
    },

    filterStateExists: function (id) {
      return !!this.model.get("filterState").get(id);
    },

    isPrimaryFilterStateUsed: function (id) {
      return this.model.get("filterState").any(function (filter) {
        return filter.get("parent_type") === id;
      });
    },

    removeFilterStateKey: function (id) {
      this.model.get("filterState").remove(id);
    },

    addFilterStateKey: function (id, parent_type) {
      var model = {
        id: id
      };
      if (parent_type) {
        model.parent_type = parent_type;
      }
      this.model.get("filterState").set([model], {remove: false});
    },

    getParentTypeId: function () {
      return this.subtypesCollection.getParentType().get("id");
    }
  });

  return Filters;
});