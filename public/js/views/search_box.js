define([
  "jquery",
  "underscore",
  "backbone",
  "analytics",
  "utils/filter_url_serialiser",
  "text!templates/search_box.htm",
  "text!templates/search_summary.htm",
  "text!templates/search_result.htm",
  "css!/css/search_box"
], function ($, _, Backbone, Analytics, FilterUrlSerialiser, template,
    searchSummary, searchResult) {

  var SearchBoxView = Backbone.View.extend({
    el: "#search-box",

    initialize: function () {
      this.searchSummaryTemplate = _.template(searchSummary);
      this.searchResultTemplate = _.template(searchResult);
    },

    render: function () {
      this.$el.html(template);
      this.$("form").on("submit", _.bind(this.handleSearchSubmit, this));
      this.$(_.bind(function () {
        this.$("#search").focus();
      }, this));
      this.$("#search").focus();
      $("#search-box").on("hide.bs.dropdown", _.bind(this.bsHideSearchResults, this));
      $(window).on("resize", _.bind(this.handleBodyResize, this));
      return this.$el;
    },

    handleBodyResize: function () {
      var searchResults = this.$(".search-results");
      var diff = searchResults.outerHeight() - searchResults.innerHeight();
      searchResults.css("height", this.getMapHolder().height() - diff);
    },

    getMapHolder: function () {
      return $("#map-holder");
    },

    //TODO: refactor this out into a collection
    handleSearchSubmit: function (e) {
      e.preventDefault();
      this.doSearch(this.$("#search").val());
    },

    doSearch: function (searchString) {
      $.get("/search", {
        string: searchString
      }, _.bind(this.handleSearchResults, this));
    },

    handleSearchResults: function (results) {
      var formattedResults = _.map(results, this.formatResults, this);
      var searchEntries = _.map(formattedResults, this.generateSearchEntry, this);
      this.renderSearchEntries(searchEntries);
      this.bindEventsToSearchEntries();
      this.showSearchResults();
    },

    formatResults: function (x) {
      x.start_date = new Date(x.start_date);
      x.end_date = new Date(x.end_date);
      return x;
    },

    generateSearchEntry: function (x) {
      var el = $(this.searchResultTemplate(x));
      el.data("result", x);
      return el;
    },

    renderSearchEntries: function (searchEntries) {
      searchEntries.unshift(this.searchSummaryTemplate({
        searchEntries: searchEntries.length
      }));
      this.$(".dropdown-menu").html(searchEntries);
    },

    showSearchResults: function () {
      if (!this.dropdownVisible) {
        this._showSearchResults();
      }
    },
    _showSearchResults: function () {
      this.dropdownVisible = true;
      this.toggleDropdown();
      $("body").addClass("search-visible");
      this.handleBodyResize();
    },

    bsHideSearchResults: function (e) {
      e.preventDefault();
    },

    hideSearchResults: function () {
      $("body").removeClass("search-visible");
      this.toggleDropdown();
      this.dropdownVisible = false;
      this.model.set("highlights", []);
    },

    toggleDropdown: function () {
      this.$("#search").dropdown("toggle");
    },

    bindEventsToSearchEntries: function () {
      this.$(".dropdown-menu li").on("click", _.bind(this.resultSelected, this));
      this.$(".dropdown-menu li .name a").on("click", _.bind(this.preventEventPropagation, this));
      this.$(".dropdown-menu li .hide-button").on("click", _.bind(this.hideSearchResults, this));
    },

    preventEventPropagation: function (e) {
      e.stopPropagation();
    },

    resultSelected: function (e) {

      var data = this.extractData(e);

      var modelData = {};

      modelData.date = this.extractDate(data);
      modelData.highlights = [data.thing_id];

      if (data.area.length === 1) {
        this.extractPointData(modelData, data);
      } else {
        this.extractBoundingBoxData(modelData, data);
      }

      this.setModelData(modelData);

    },

    extractData: function (e) {
      return $(e.currentTarget).data("result");
    },

    extractDate: function (data) {
      var dateDiff = data.end_date.getFullYear() - data.start_date.getFullYear();
      var dateOffset = 0;
      if (dateDiff < 10) {
        dateOffset = Math.floor((10 - dateDiff) / 2);
      }
      return [data.start_date.getFullYear() - dateOffset,
        data.end_date.getFullYear() + dateOffset];
    },

    extractPointData: function (modelData, data) {
      modelData.center = [data.area[0].lat, data.area[0].lon];
      modelData.zoom = 12;
    },

    extractBoundingBoxData: function (modelData, data) {
      var lat1 = data.area[0].lat;
      var lat2 = data.area[1].lat;
      var lon1 = data.area[0].lon;
      var lon2 = data.area[1].lon;

      modelData.zoom = -1;
      modelData.center = this.extractCenter(lat1, lon1, lat2, lon2);
      modelData.bounds = this.extractBounds(lat1, lon1, lat2, lon2);
    },

    extractCenter: function (lat1, lon1, lat2, lon2) {
      var midPoint = function (points) {
        return _.reduce(
            points,
            function (a, b) { return a + b; },
            0
          ) / points.length;
      };
      return [
        midPoint([lat1, lat2]),
        midPoint([lon1, lon2])
      ];

    },

    extractBounds: function (lat1, lon1, lat2, lon2) {
      var bounds = [{}, {}];

      this.extractBound(bounds, "lon", lon1, lon2);
      this.extractBound(bounds, "lat", lat1, lat2);
      return bounds;
    },

    extractBound: function (bounds, key, a, b) {
      var delta = (b - a) / 10;
      if (b > a) {
        bounds[0][key] = a - delta;
        bounds[1][key] = b + delta;
      } else {
        bounds[0][key] = a + delta;
        bounds[1][key] = b - delta;
      }
      return bounds;
    },

    setModelData: function (modelData) {
      this.model.set(modelData, {silent: true});
      FilterUrlSerialiser.deserialise("", this.model);
      this.model.trigger("change change:filterState change:date");
    }

  });

  return SearchBoxView;
});