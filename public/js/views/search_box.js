define([
  "jquery",
  "underscore",
  "backbone",
  "analytics",
  "utils/position",
  "utils/scroll",
  "utils/filter_url_serialiser",
  "text!templates/search_box.htm",
  "text!templates/search_summary.htm",
  "text!templates/search_result.htm",
  "css!/css/search_box"
], function ($, _, Backbone, Analytics, Position, Scroll, FilterUrlSerialiser,
    template, searchSummary, searchResult) {

  var SearchBoxView = Backbone.View.extend({
    el: "#search-box",

    initialize: function () {
      this.searchSummaryTemplate = _.template(searchSummary);
      this.searchResultTemplate = _.template(searchResult);
    },

    render: function () {
      this.$el.html(template);
      this.$("form").on("submit", _.bind(this.handleSearchSubmit, this));
      this.$(".search-button").on("click", _.bind(this.handleSearchSubmit, this));
      this.$(_.bind(function () {
        this.$("#search").focus();
      }, this));
      this.model.on("change:query", this.updateQuery, this);
      this.model.on("change:highlight", this.updateHighlight, this);
      this.$("#search").focus();
      $("#search-box").on("hide.bs.dropdown", _.bind(this.bsHideSearchResults, this));
      $("#search-box").on("show.bs.dropdown", _.bind(this.bsShowSearchResults, this));
      this.addAnalytics();
      $(window).on("resize", _.bind(this.handleBodyResize, this));
      this.updateQuery();
      return this.$el;
    },

    addAnalytics: function () {
      this.searchBoxClear = true;
      this.$("#search").on("keyup", _.bind(this.searchBoxTyped, this));
      this.$("#search").on("paste", _.bind(this.handleSearchPaste, this));
      this.$("#search").on("copy", _.bind(this.handleSearchCopy, this));
      this.$("#search").on("cut", _.bind(this.handleSearchCopy, this));
    },

    handleSearchPaste: function (/* e */) {
      var text = this.$("#search").val();
      Analytics.searchPasted({text: text});
    },

    handleSearchCopy: function (e) {
      var text = this.$("#search").val();
      Analytics.searchCopied({
        text: text,
        type: e.type
      });
    },

    searchBoxTyped: function (e) {
      var text = this.$("#search").val();
      if (e.keyCode !== 13) {
        if (this.searchBoxClear) {
          if (text.length !== 0) {
            this.searchBoxClear = false;
            Analytics.searchBoxCharacterTyped({text: text});
          }
        } else if (text.length === 5) {
          Analytics.searchBoxStringTyped({text: text});
        } else if (text.length === 0) {
          this.searchBoxClear = true;
          Analytics.searchBoxCleared();
        }
      }
    },

    updateQuery: function () {
      var queryString = this.model.get("query");
      this.$("#search").val(queryString ? queryString : "");
      if (queryString) {
        this.search();
      } else {
        this.hideSearchResults();
      }
    },

    updateHighlight: function () {
      var highlight = this.model.get("highlight");

      if (highlight.reset) {
        this.search();
      } else {

        this.highlightSelectedResult();

        var el = this.$(".search-result[data-id=" + highlight.id + "]");
        if (el) {
          if (!highlight.points) {
            this.search();
          }
        }
      }
    },

    handleBodyResize: function () {
      var searchResults = this.$(".search-results");
      var diff = searchResults.outerHeight() - searchResults.innerHeight();
      searchResults.css("height", this.getMapHolder().height() - diff);
    },

    getMapHolder: function () {
      return $("#map-holder");
    },

    handleSearchSubmit: function (e) {
      e.preventDefault();
      this.search();
      Analytics.searchSubmitted({
        submission_type: e.type === "submit" ? "keyboard" : "mouse"
      });
    },

    search: function () {
      var queryString = this.$("#search").val();
      this.model.set("query", queryString);
      this.showLoadingState();
      this.doSearch(queryString);
    },

    doSearch: function (searchString) {
      //TODO: refactor this out into a collection
      $.get("/search", {
        string: searchString
      }, _.bind(this.handleSearchResults, this));
    },

    handleSearchResults: function (results) {
      var formattedResults = _.map(results, this.formatResults, this);
      var searchEntries = _.map(formattedResults, this.generateSearchEntry, this);
      this.renderSearchEntries(searchEntries);
      this.bindEventsToSearchEntries();
      this.hideLoadingState();
      this.showSearchResults();
      this.highlightSelectedResult();
    },

    showLoadingState: function () {
      this.$el.addClass("loading");
    },

    hideLoadingState: function () {
      this.$el.removeClass("loading");
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

    bsShowSearchResults: function (e) {
      if (!this.dropdownVisible) {
        e.preventDefault();
      }
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
      this.model.trigger("force-change");
    },

    bsHideSearchResults: function (e) {
      if (this.dropdownVisible) {
        e.preventDefault();
      }
    },

    hideSearchResults: function () {
      if (this.dropdownVisible) {
        $("body").removeClass("search-visible");
        this.dropdownVisible = false;
        this.toggleDropdown();
        var queryString = this.model.get("query");
        this.model.set("query", "");
        this.model.set("highlight", {});
        this.model.trigger("force-change");
        if (queryString) {
          this.$("#search").val(queryString);
        }
        Analytics.hideSearchResults();
      }
    },

    toggleDropdown: function () {
      this.$("#search").dropdown("toggle");
    },

    bindEventsToSearchEntries: function () {
      this.$(".dropdown-menu li.search-result").on("click", _.bind(this.resultSelected, this));
      this.$(".dropdown-menu li .name a").on("click", _.bind(this.searchLinkClicked, this));
      this.$(".dropdown-menu li .hide-button").on("click", _.bind(this.hideSearchResults, this));
    },

    searchLinkClicked: function (e) {
      this.preventEventPropagation(e);
      var data = this.getSearchLinkDataFromEvent(e);
      Analytics.searchEntryLinkClicked(data);
    },

    getSearchLinkDataFromEvent: function (e) {
      var data = $(e.target).parent().parent().parent().data().result;
      delete data.area;
      delete data.points;
      return data;
    },

    preventEventPropagation: function (e) {
      e.stopPropagation();
    },

    resultSelected: function (e) {

      var data = this.extractData(e);

      var modelData = {};

      modelData.date = this.extractDate(data);
      modelData.highlight = this.getHighlightFromJSON(data);

      if (data.area.length === 1) {
        this.extractPointData(modelData, data);
      } else {
        this.extractBoundingBoxData(modelData, data);
      }

      window.lastEvent = "search";
      this.setModelData(modelData);

      this.highlightSelectedResult();
      Analytics.searchEntryClicked(data);
    },

    highlightSelectedResult: function () {
      this.$(".search-result").removeClass("selected");
      var highlight = this.model.get("highlight");
      var id = highlight.id;
      var el = this.$(".search-result[data-id=" + id + "]");
      if (el.length > 0) {
        el.addClass("selected");

        var data = el.data("result");
        this.model.set("highlight", this.getHighlightFromJSON(data));

        Scroll.intoView(el, this.$(".search-results"), 100);

        if (highlight.reset) {
          this.resetHighlight(data);
        }
      }
    },

    resetHighlight: function (data) {
      if (data.area.length > 1) {
        var modelData = {};
        modelData.date = [
          data.start_date.getFullYear(),
          data.end_date.getFullYear()
        ];
        this.extractBoundingBoxData(modelData, data);
        this.model.set(modelData);
      }
    },

    getHighlightFromJSON: function (data) {
      return {
        id: data.thing_id,
        points: data.points || data.area
      };
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
      modelData.center = Position.getCenter(lat1, lon1, lat2, lon2);
      modelData.bounds = this.extractBounds(lat1, lon1, lat2, lon2);
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
