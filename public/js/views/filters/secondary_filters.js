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
      this.rolesCollection = opts.rolesCollection;
      this.eventTypesCollection = opts.eventTypesCollection;
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
        window.lastEvent = "filterChange";
        this.model.trigger("change:filterState");
      }
    },

    setSecondaries: function (parentTypeId) {
      this.model.removeFilterStateKey(this.getId(this.getNotSelectedId(parentTypeId)));
      var removed = false;
      this.currentCollection.forEach(function (filter) {
        removed = removed || this.model.removeFilterStateKey(this.getId(filter.get("id")), true);
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

      if (_.isString(filter.id)) {
        this.idPrefix = filter.id;
        if (filter.id === "et") {
          this.currentCollection = this.eventTypesCollection;
        } else if (filter.id === "r") {
          this.currentCollection = this.rolesCollection;
        }
        this.setParentTypeId(filter.id);
        this._showSecondaryFilters();
      } else {
        this.idPrefix = null;
        this.setParentTypeId(filter.id);
        this.setDefaultCollection();

        this.currentCollection.updateData({
          reset: true,
          id: filter.id
        }).then(_.bind(this._showSecondaryFilters, this));
      }
    },

    setDefaultCollection: function () {
      this.currentCollection = this.subtypesCollection;
    },

    _showSecondaryFilters: function () {
      var secondary = this.$(".options");
      secondary.html("");
      var parentTypeId = this.getParentTypeId();
      var isParentUnselected = this.model.filterStateExists(parentTypeId);
      if (!this.idPrefix) {
        this._showSecondaryFilter(
          isParentUnselected,
          secondary,
          new Backbone.Model({
            id: this.getNotSelectedId(parentTypeId),
            parent_type: parentTypeId,
            name: "Not Specified",
            not_specified: true
          }
        ));
      }
      this.currentCollection.forEach(
        _.bind(this._showSecondaryFilter,
          this, isParentUnselected, secondary)
      );
      this.updateVisibleSecondaryFilters();
    },

    getNotSelectedId: function (parentTypeId) {
      return _.isString(parentTypeId) ? ".ns" : -parentTypeId;
    },

    getId: function (id) {
      return this.idPrefix + id;
    },

    _showSecondaryFilter: function (isParentUnselected, secondary, filter) {
      var json = filter.toJSON();

      json.isUnset = isParentUnselected || this.model.filterStateExists(this.getId(json.id));
      json.isHalfSet = false;
      json.not_specified = json.not_specified === true || json.not_specified === false;
      json.special = false;
      json.isSelected = false;
      if (this.idPrefix) {
        json.id = this.getId(json.id);
      }
      var el = $(this.filterTemplate(json));
      secondary.append(el);
      el.find("input[type=checkbox]").on("change", _.bind(this._checkSecondary, this, filter));
    },

    _checkSecondary: function (filter, event) {
      analytics.filterEventsBySecondary(_.extend(
        {parentTypeId: this.getParentTypeId()},
        filter.toJSON()
      ));
      this._updateFilterState(filter, $(event.currentTarget).prop("checked"));
      window.lastEvent = "filterChange";
      this.model.trigger("change:filterState");
    },

    _updateFilterState: function (filter, checked) {
      var id = this.getId(filter.id);
      if (checked) {
        this.model.removeFilterStateKey(id);
      } else {
        this.model.addFilterStateKey(id, filter.get("parent_type") || this.getParentTypeId());
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

      return this.currentCollection.all(function (subtype) {
          return this.model.filterStateExists(this.getId(subtype.get("id")));
        }, this) &&

        (
          !!this.idPrefix ||
          this.model.filterStateExists(this.getId(this.getNotSelectedId(this.getParentTypeId())))
        );
    },

    switchAllSecondarysForPrimary: function () {
      var removed = false;
      this.currentCollection.forEach(function (subtype) {
        removed = true;
        this.model.removeFilterStateKey(this.getId(subtype.get("id")), true);
      }, this);
      this.model.removeFilterStateKey(this.getId(this.getNotSelectedId(this.getParentTypeId())), true);
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
      this.$el.find("input[type=checkbox]").each(_.bind(function (i, el) {
        added = true;
        var $el = $(el);
        var id = $el.attr("data-id");
        id = _.isString(parentTypeId) ? id : parseInt($el.attr("data-id"), 10);
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
      return this.parentTypeId;
    },
    setParentTypeId: function (id) {
      this.parentTypeId = id;
    }
  });

  return SecondaryFilters;
});