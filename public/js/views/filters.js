define([
  "jquery",
  "underscore",
  "backbone",
  "text!templates/filters.htm",
  "text!templates/filter.htm"
], function ($, _, Backbone, template, filterTemplate) {

  var Filters = Backbone.View.extend({
    el: "#filters-container",

    data: [
      {
        id: 1,
        name: "Constructions",
        types: [
          {
            id: 101,
            name: "Offices"
          },
          {
            id: 102,
            name: "Bridges"
          },
          {
            id: 102,
            name: "Train Stations"
          }
        ]
      },
      {
        id: 2,
        name: "Organisations",
        types: [
          {
            id: 201,
            name: "Businesses"
          },
          {
            id: 202,
            name: "Political Groups"
          }
        ]
      },
      {
        id: 3,
        name: "People",
        types: [
          {
            id: 301,
            name: "Scientists"
          },
          {
            id: 302,
            name: "Philosphers"
          }
        ]
      },
      {
        id: 4,
        name: "Places",
        types: [
          {
            id: 401,
            name: "Settlements"
          },
          {
            id: 402,
            name: "Natural features"
          }
        ]
      }
    ],

    initialize: function (opts) {      
      this.eventsCollection = opts.eventsCollection;
    },

    render: function () {
      this.$el.html(template);
      this.showPrimaryFilters();
      return this.$el;
    },

    showPrimaryFilters: function () {
      var primary = this.$(".primary .options");
      var template =  _.template(filterTemplate);
      _.forEach(this.data, function (filter) {
        var el = $(template(filter));
        primary.append(el);
        el.hover(_.bind(this.showSecondaryFilters, this, filter));
      }, this);
    },

    showSecondaryFilters: function (filter) {
      var secondary = this.$(".secondary .options");
      secondary.html("");
      var template =  _.template(filterTemplate);
      _.forEach(filter.types, function (filter) {
        var el = template(filter);
        secondary.append(el);
      }, this);
    }
  });

  return Filters;
});