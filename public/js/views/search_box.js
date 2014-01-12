define([
  "jquery",
  "underscore",
  "backbone",
  "analytics",
  "utils/filter_url_serialiser",
  "text!templates/search_box.htm",
  "text!templates/search_result.htm",
  "css!/css/search_box"
], function ($, _, Backbone, Analytics, FilterUrlSerialiser, template, searchResult) {

  var SearchBoxView = Backbone.View.extend({
    el: "#search-box",

    initialize: function () {
      this.searchResultTemplate = _.template(searchResult);
    },

    render: function () {
      this.$el.html(template);
      this.$("form").on("submit", _.bind(this.handleSearchSubmit, this));
      setTimeout(_.bind(function () {

        this.$("#search").focus();
      }, this), 200);
      $("#search-box").on("hidden.bs.dropdown", _.bind(this.hideSearchResults, this));
      $(window).on("resize", _.bind(this.handleBodyResize, this));
    },

    handleBodyResize: function () {
      var searchResults = this.$(".search-results");
      var diff = searchResults.outerHeight() - searchResults.innerHeight();
      searchResults.css("height", $("#map-holder").height() - diff);
    },

    //TODO: refactor this out into a collection
    handleSearchSubmit: function (e) {
      e.preventDefault();
      $.get("/search", {
        string: this.$("#search").val()
      }, _.bind(this.handleSearchResults, this));
    },

    handleSearchResults: function (results) {
      var els = _.map(results, function (x) {
        x.start_date = new Date(x.start_date);
        x.end_date = new Date(x.end_date);
        var el = $(this.searchResultTemplate(x));
        el.data("result", x);
        return el;
      }, this);
      this.$(".dropdown-menu").html(els);
      this.$(".dropdown-menu li").on("click", _.bind(this.resultSelected, this));
      this.$(".dropdown-menu li .name a").on("click", _.bind(function (e) {
        e.stopPropagation();
      }, this));

      if (!this.dropdownVisible) {
        this.dropdownVisible = true;
        this.$("#search").dropdown("toggle");
        $("body").addClass("search-visible");
        this.handleBodyResize();
      }
    },

    hideSearchResults: function () {
      $("body").removeClass("search-visible");
      this.$("#search").dropdown("toggle");
      this.dropdownVisible = false;
    },

    resultSelected: function (e) {
      var data = $(e.currentTarget).data("result");

      var modelData = {};
      var dateDiff = data.end_date.getFullYear() - data.start_date.getFullYear();
      var dateOffset = 0;
      if (dateDiff < 10) {
        dateOffset = Math.floor((10 - dateDiff) / 2);
      }
      modelData.date = [data.start_date.getFullYear() - dateOffset,
        data.end_date.getFullYear() + dateOffset];
      if (data.area.length === 1) {
        modelData.center = [data.area[0].lat, data.area[0].lon];
        modelData.zoom = 12;

      } else {
        var midPoint = function (points) {
          return _.reduce(points, function (a, b) { return a + b; }, 0) / points.length;
        };

        var lats = [data.area[0].lat, data.area[1].lat];
        var lons = [data.area[0].lon, data.area[1].lon];
        modelData.center = [
          midPoint(lats),
          midPoint(lons)
        ];

        var d_x = (lons[1] - lons[0]) / 10;
        var d_y = (lats[1] - lats[0]) / 10;
        var bounds = [{}, {}];
        if (data.area[1].lon > data.area[0].lon) {
          bounds[0].lon = data.area[0].lon - d_y;
          bounds[1].lon = data.area[1].lon + d_y;
        } else {
          bounds[0].lon = data.area[0].lon + d_y;
          bounds[1].lon = data.area[1].lon - d_y;
        }
        if (data.area[1].lat > data.area[0].lat) {
          bounds[0].lat = data.area[0].lat - d_x;
          bounds[1].lat = data.area[1].lat + d_x;
        } else {
          bounds[0].lat = data.area[0].lat + d_x;
          bounds[1].lat = data.area[1].lat - d_x;
        }

        modelData.zoom = -1;
        modelData.bounds = bounds;
      }
      modelData.highlights = [data.thing_id];
      this.model.set(modelData, {silent: true});
      FilterUrlSerialiser.deserialise("", this.model);
      this.model.trigger("change change:filterState change:date");
    }

  });

  return SearchBoxView;
});