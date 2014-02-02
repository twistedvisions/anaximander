define([
  "jquery",
  "underscore",
  "backbone",
  "fuse",
  "analytics",
  "text!templates/filters-secondary.htm",
  "text!templates/filter.htm"
], function ($, _, Backbone, Fuse, analytics, template, filterTemplate) {

  var SecondaryFilters = Backbone.View.extend({
    initialize: function (opts) {
      this.subtypesCollection = opts.subtypesCollection;
      this.filterTemplate =  _.template(filterTemplate);
    },

    render: function () {
      this.$el.html(template);
      this.bindSecondaryFilterEvents();
      return this.$el;
    },

    bindSecondaryFilterEvents: function () {
      this.$("#secondary-filter").on("keyup",
        _.bind(this.filterSecondaryFilters, this));

      this.$("#toggle-selection").on("click",
        _.bind(this.toggleVisibleCheckboxes, this));
    },

    filterSecondaryFilters: function () {
      var searchString = this.$("#secondary-filter").val();
      analytics.filterSecondaryFilters({searchString: searchString});
      this.updateVisibleSecondaryFilters();
    },

    updateVisibleSecondaryFilters: function () {
      var searchString = this.$("#secondary-filter").val();
      var els = this.$(".filter");
      if (searchString.length > 0) {
        this.$("#toggle-selection").addClass("visible");
        var values = [];
        els.each(function (index, el) {
          values.push($(el).find(".name").text());
        });
        var matcher = new Fuse(values, {threshold: 0.4});
        var matches = matcher.search(searchString);

        matches = _.indexBy(matches, _.identity);
        els.each(function (index, el) {
          el = $(el);
          if (!matches[index]) {
            el.hide();
          } else {
            el.show();
          }
        });
      } else {
        this.$("#toggle-selection").removeClass("visible");
        els.each(function (index, el) {
          $(el).show();
        });
      }
    },

    toggleVisibleCheckboxes: function () {
      analytics.toggleSecondaryFilterSelection();
      var parentId = this.getParentTypeId();
      var first = this.$(".filter:visible input[type=checkbox]").first();
      var shouldCheck = !$(first).prop("checked");
      var anyChanged = false;

      this.$(".filter:visible").each(_.bind(function (i, el) {

        var el = $(el);
        el.find("input[type=checkbox]").prop("checked", shouldCheck);
        var id = parseInt(el.attr("data-id"), 10);

        if (shouldCheck) {
          this.model.removeFilterStateKey(id, parentId, true);
        } else {
          this.model.addFilterStateKey(id, parentId, true);
        }
        anyChanged = true;

      }, this));

      if (anyChanged) {
        var updated;
        updated = this.normaliseFilters();
        if (!updated) {
          if (shouldCheck) {
            this.model.get("filterState").trigger("add");
          } else {
            this.model.get("filterState").trigger("remove");
          }
        }
        this.model.trigger("change:filterState");
      }
    },

    setSecondaries: function (id) {
      this.model.removeFilterStateKey(-id);
      var removed = false;
      this.subtypesCollection.forEach(function (filter) {
        this.model.removeFilterStateKey(filter.get("id"), true);
        removed = true;
      }, this);
      if (removed) {
        this.model.get("filterState").trigger("remove");
      }
      this._showSecondaryFilters();
    },

    showSecondaryFilters: function (filter) {
      this.lastPrimarySelected = filter;
      this.$("#secondary-filter").select();
      var secondary = this.$(".options");
      secondary.html("");
      this.subtypesCollection.setParentType(filter);

      this.subtypesCollection.updateData({
        reset: true
      }).then(_.bind(this._showSecondaryFilters, this));
    },

    _showSecondaryFilters: function () {
      var secondary = this.$(".options");
      secondary.html("");
      var parentTypeId = this.getParentTypeId();
      var isParentUnselected = this.model.filterStateExists(parentTypeId);
      this._showSecondaryFilter(isParentUnselected, secondary, new Backbone.Model({
        id: -parentTypeId,
        parent_type: parentTypeId,
        name: "Not Specified",
        not_specified: true
      }));
      this.subtypesCollection.forEach(
        _.bind(this._showSecondaryFilter,
          this, isParentUnselected, secondary)
      );
      this.updateVisibleSecondaryFilters();
    },

    _showSecondaryFilter: function (isParentUnselected, secondary, filter) {
      var json = filter.toJSON();
      json.isUnset = isParentUnselected || this.model.filterStateExists(json.id);
      json.isHalfSet = false;
      json.not_specified = json.not_specified === true || json.not_specified === false;
      var el = $(this.filterTemplate(json));
      secondary.append(el);
      el.find("input[type=checkbox]").on("change", _.bind(this._checkSecondary, this, filter));
    },

    _checkSecondary: function (filter, event) {
      analytics.filterEventsBySecondary(filter.toJSON());
      this._updateFilterState(filter, $(event.currentTarget).prop("checked"));
      this.model.trigger("change:filterState");
    },

    _updateFilterState: function (filter, checked) {
      var id = filter.get("id");
      if (checked) {
        this.model.removeFilterStateKey(id);
      } else {
        this.model.addFilterStateKey(id, filter.get("parent_type"));
      }
      this.normaliseFilters();
    },

    normaliseFilters: function () {
      var changed = false;
      if (this.allSecondariesUnchecked()) {
        changed = this.switchAllSecondarysForPrimary();
      } else {
        changed = this.setRemainingSecondaryFilters();
      }
      return changed;
    },

    allSecondariesUnchecked: function () {
      return this.subtypesCollection.all(function (subtype) {
        return this.model.filterStateExists(subtype.get("id"));
      }, this);
    },

    switchAllSecondarysForPrimary: function () {
      var removed = false;
      this.subtypesCollection.forEach(function (subtype) {
        removed = true;
        this.model.removeFilterStateKey(subtype.get("id"), true);
      }, this);
      this.model.removeFilterStateKey(-this.getParentTypeId(), true);
      if (removed) {
        this.model.get("filterState").trigger("remove");
      }

      this.model.addFilterStateKey(this.getParentTypeId());

      return removed;
    },

    setRemainingSecondaryFilters: function () {
      var parentTypeId = this.getParentTypeId();
      this.model.removeFilterStateKey(parentTypeId);
      var added = false;
      this.$el.find(".secondary input[type=checkbox]").each(_.bind(function (i, el) {
        added = true;
        var $el = $(el);
        var id = parseInt($el.attr("data-id"), 10);
        if (!$el.prop("checked")) {
          this.model.addFilterStateKey(id, parentTypeId, true);
        }
      }, this));
      if (added) {
        this.model.get("filterState").trigger("add");
      }
      return added;
    },

    getParentTypeId: function () {
      return this.subtypesCollection.getParentType().get("id");
    }
  });

  return SecondaryFilters;
});