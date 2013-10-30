define([
  "jquery",
  "underscore",
  "backbone",
  "fuse",
  "../analytics",
  "text!templates/filters.htm",
  "text!templates/filter.htm",
  "css!/css/filters"
], function ($, _, Backbone, Fuse, analytics, template, filterTemplate) {

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
      this.filterSecondaryFilters();
      this.$("#toggle-selection").on("click", _.bind(this.toggleVisible, this));
      return this.$el;
    },

    toggleVisible: function () {
      analytics.toggleSecondaryFilterSelection();
      var parentId = this.getParentTypeId();
      var first = this.$(".secondary .filter:visible input[type=checkbox]").first();
      var shouldCheck = !$(first).prop("checked");
      var anyChanged = false;

      this.$(".secondary .filter:visible").each(_.bind(function (i, el) {

        var el = $(el);
        el.find("input[type=checkbox]").prop("checked", shouldCheck);
        var id = parseInt(el.attr("data-id"), 10);

        if (shouldCheck) {
          this.removeFilterStateKey(id, parentId, true);
        } else {
          this.addFilterStateKey(id, parentId, true);
        }
        anyChanged = true;

      }, this));

      if (anyChanged) {
        var updated;
        updated = this.normaliseFilters();
        //todo: only update the one primary not all of them
        this.updatePrimaryFilters();
        if (!updated) {
          if (shouldCheck) {
            this.model.get("filterState").trigger("add");
          } else {
            this.model.get("filterState").trigger("remove");
          }
        }
      }
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
        el.find("input[type=checkbox]").on("change", _.bind(function (event) {
          analytics.filterEventsByPrimary(json);
          var input = $(event.currentTarget);
          this.checkPrimary(filter, input.prop("checked"));
          input.removeClass("half");
        }, this));
      }, this);
    },

    filterSecondaryFilters: function () {
      this.$("#secondary-filter").on("keyup",
        _.bind(this._filterSecondaryFilters, this));
    },

    _filterSecondaryFilters: function () {
      var searchString = this.$("#secondary-filter").val();
      analytics.filterSecondaryFilters({searchString: searchString});
      this.updateVisibleSecondaryFilters();
    },
    updateVisibleSecondaryFilters: function () {
      var searchString = this.$("#secondary-filter").val();
      var els = this.$(".secondary .filter");
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

    checkPrimary: function (filter, isChecked) {
      var id = filter.get("id");
      //can do this silently because secondary will trigger
      if (isChecked) {
        this.removeFilterStateKey(id, null, true);
      } else {
        this.addFilterStateKey(id, null, true);
      }
      this.subtypesCollection.setParentType(filter);
      this.subtypesCollection.updateData({
        reset: true,
        success: _.bind(this._setSecondaries, this, id)
      });
    },

    _setSecondaries: function (id) {
      this.removeFilterStateKey(-id);
      var removed = false;
      this.subtypesCollection.forEach(function (filter) {
        this.removeFilterStateKey(filter.get("id"), true);
        removed = true;
      }, this);
      if (removed) {
        this.model.get("filterState").trigger("remove");
      }
      this._showSecondaryFilters();
    },

    showSecondaryFilters: function (filter) {
      this.$(".primary .filter").removeClass("selected");
      this.$(".primary .filter[data-id=" + filter.get("id") + "]").addClass("selected");
      this.$("#secondary-filter").select();
      var secondary = this.$(".secondary .options");
      secondary.html("");
      this.subtypesCollection.setParentType(filter);

      this.subtypesCollection.updateData({
        reset: true,
        success: _.bind(this._showSecondaryFilters, this)
      });
    },

    _showSecondaryFilters: function () {
      var template =  _.template(filterTemplate);
      var secondary = this.$(".secondary .options");
      secondary.html("");
      var parentTypeId = this.getParentTypeId();
      var isParentUnselected = this.filterStateExists(parentTypeId);
      this._showSecondaryFilter(isParentUnselected, secondary, template, new Backbone.Model({
        id: -parentTypeId,
        parent_type: parentTypeId,  
        name: "Not Specified",
        not_specified: true
      }));
      this.subtypesCollection.forEach(
        _.bind(this._showSecondaryFilter, 
          this, isParentUnselected, secondary, template)
      );
      this.updateVisibleSecondaryFilters();
    },

    _showSecondaryFilter: function (isParentUnselected, secondary, template, filter) {
      var json = filter.toJSON();
      json.isUnset = isParentUnselected || this.filterStateExists(json.id);
      json.isHalfSet = false;
      json.not_specified = json.not_specified === true || json.not_specified === false;
      var el = $(template(json));
      secondary.append(el);
      el.find("input[type=checkbox]").on("change", _.bind(this.checkSecondary, this, filter));
    },

    checkSecondary: function (filter, event) {
      analytics.filterEventsBySecondary(filter.toJSON());
      this.updateFilterState(filter, $(event.currentTarget).prop("checked"));

      //todo: only update the one primary not all of them
      this.updatePrimaryFilters();
    },

    updateFilterState: function (filter, checked) {
      var id = filter.get("id");
      if (checked) {
        this.removeFilterStateKey(id);
      } else {
        this.addFilterStateKey(id, filter.get("parent_type"));
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
        return this.filterStateExists(subtype.get("id"));
      }, this);
    },
    switchAllSecondarysForPrimary: function () {
      var removed = false;
      this.subtypesCollection.forEach(function (subtype) {
        removed = true;
        this.removeFilterStateKey(subtype.get("id"), true);
      }, this);
      this.removeFilterStateKey(-this.getParentTypeId(), true);
      if (removed) {
        this.model.get("filterState").trigger("remove");
      }

      this.addFilterStateKey(this.getParentTypeId());

      return removed;
    },

    setRemainingSecondaryFilters: function () {
      var parentTypeId = this.getParentTypeId();
      this.removeFilterStateKey(parentTypeId);
      var added = false;
      this.$el.find(".secondary input[type=checkbox]").each(_.bind(function (i, el) {
        added = true;
        var $el = $(el);
        var id = parseInt($el.attr("data-id"), 10);
        if (!$el.prop("checked")) {
          this.addFilterStateKey(id, parentTypeId, true);
        }
      }, this));
      if (added) {
        this.model.get("filterState").trigger("add");
      }
      return added;
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

    removeFilterStateKey: function (id, silent) {
      this.model.get("filterState").remove(id, {silent: !!silent});
    },

    addFilterStateKey: function (id, parentType, silent) {
      var model = {
        id: id
      };
      if (parentType) {
        model.parent_type = parentType;
      }
      this.model.get("filterState").set([model], {remove: false, silent: !!silent});
    },

    getParentTypeId: function () {
      return this.subtypesCollection.getParentType().get("id");
    }
  });

  return Filters;
});