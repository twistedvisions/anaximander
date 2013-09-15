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
      this.filterState = {};
    },

    render: function () {
      this.$el.html(template);
      this.showPrimaryFilters();
      return this.$el;
    },

    showPrimaryFilters: function () {
      var primary = this.$(".primary .options");
      primary.html("");
      var template =  _.template(filterTemplate);
      this.typesCollection.forEach(function (filter) {
        var json = filter.toJSON();
        json.isUnset = !!this.filterState[json.id];
        var id = filter.get("id");
        json.isHalfSet = _.any(_.values(this.filterState), function (filter) {
          return filter.parent_type === id;
        });
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

    showSecondaryFilters: function (filter) {
      var secondary = this.$(".secondary .options");
      secondary.html("");
      this.subtypesCollection.setParentType(filter);

      this.subtypesCollection.fetch({
        reset: true,
        success: _.bind(this._showSecondaryFilters, this)
      });
    },

    setState: function (filterState) {
      this.filterState = filterState;
    },

    checkPrimary: function (filter, isChecked) {
      this.subtypesCollection.setParentType(filter);
      this.subtypesCollection.fetch({
        reset: true,
        success: _.bind(this._setSecondaries, this, isChecked)
      });
    },

    _setSecondaries: function (isChecked) {
      this.subtypesCollection.forEach(function (filter) {
        if (isChecked) {
          delete this.filterState[filter.get("id")];
        } else {
          this.filterState[filter.get("id")] = true;
        }
      }, this);
      this._showSecondaryFilters();
    },

    _showSecondaryFilters: function () {
      var template =  _.template(filterTemplate);
      var secondary = this.$(".secondary .options");
      secondary.html("");
      var parentTypeId = this.subtypesCollection.getParentType().get("id");
      var isParentUnselected = !!this.filterState[parentTypeId];
      this.subtypesCollection.forEach(function (filter) {
        var json = filter.toJSON();
        json.isUnset = isParentUnselected || this.filterState[json.id];
        json.isHalfSet = false;
        var el = $(template(json));
        secondary.append(el);
        el.find("input").on("change", _.bind(this.checkSecondary, this, filter));
      }, this);
    },

    checkSecondary: function (filter, event) {
      var id = filter.get("id");  
      var checked = $(event.currentTarget).prop("checked");
      if (checked) {
        delete this.filterState[id];
      } else {
        this.filterState[id] = {parent_type: filter.get("parent_type")};
      }
      if (this.allSecondariesUnchecked()) {
        this.switchAllSecondarysForPrimary();
      } else {
        this.setRemainingSecondaryFilters();
      }
      //todo: only update the one
      this.showPrimaryFilters();
    },
    allSecondariesUnchecked: function () {
      return this.subtypesCollection.all(function (subtype) {
        return !!this.filterState[subtype.get("id")];
      }, this);
    },
    switchAllSecondarysForPrimary: function () {
      this.subtypesCollection.forEach(function (subtype) {
        delete this.filterState[subtype.get("id")];
      }, this);

      this.filterState[this.getParentTypeId()] = {
        parent_type: null
      };
    },
    setRemainingSecondaryFilters: function () {
      var parentTypeId = this.getParentTypeId();
      delete this.filterState[parentTypeId];
      this.$el.find(".secondary input").each(_.bind(function (i, el) {
        var $el = $(el);
        var id = parseInt($el.attr("data-id"), 10);
        if (!$el.prop("checked")) {
          this.filterState[id] = {parent_type: parentTypeId};
        }
      }, this));
    },
    getParentTypeId: function () {
      return this.subtypesCollection.getParentType().get("id");
    },

    getFilters: function () {
      return this.filterState;
    }
  });

  return Filters;
});