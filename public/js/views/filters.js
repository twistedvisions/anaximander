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
      this.showPrimaryFilters();
      return this.$el;
    },

    showPrimaryFilters: function () {
      var primary = this.$(".primary .options");
      var template =  _.template(filterTemplate);
      this.typesCollection.forEach(function (filter) {
        var el = $(template(filter.toJSON()));
        primary.append(el);
        el.hover(_.bind(this.showSecondaryFilters, this, filter));
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

    _showSecondaryFilters: function () {
      var template =  _.template(filterTemplate);
      var secondary = this.$(".secondary .options");
      this.subtypesCollection.forEach(function (filter) {
        var el = template(filter.toJSON());
        secondary.append(el);
      }, this);
    }
  });

  return Filters;
});