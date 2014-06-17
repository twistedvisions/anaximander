define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "analytics",
  "utils/highlight",
  "utils/scroll",
  "utils/filter_url_serialiser",
  "models/current_user",
  "views/thing_editor_modal",
  "collections/search_results",
  "collections/things",
  "text!templates/search_box.htm",
  "text!templates/search_summary.htm",
  "text!templates/search_result.htm",
  "less!../../css/search_box"
], function ($, _, Backbone, when,
    Analytics, Highlight, Scroll, FilterUrlSerialiser, User, ThingEditor,
    SearchResults, Things, template, searchSummary, searchResult) {

  var SearchBoxView = Backbone.View.extend({
    el: "#search-box",

    initialize: function (/*opts*/) {
      this.searchSummaryTemplate = _.template(searchSummary);
      this.searchResultTemplate = _.template(searchResult);
      this.searchResults = new SearchResults();
      this.searchResults.on("reset", this.handleSearchResults, this);
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
          if (highlight.id && !highlight.points) {
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
        submission_type: e.type === "submit" ? "keyboard" : "mouse",
        text: this.$("#search").val()
      });
    },

    search: function () {
      var queryString = this.$("#search").val();
      this.model.set("query", queryString, {silent: true});
      this.showLoadingState();
      this.doSearch(queryString);
    },

    doSearch: function (searchString) {
      this.searchResults.fetch({reset: true, data: $.param({string: searchString})});
    },

    handleSearchResults: function (results) {
      var searchEntries = results.map(this.generateSearchEntry, this);
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

    generateSearchEntry: function (x) {
      var el = $(this.searchResultTemplate(_.extend({
        canEdit: User.user.get("logged-in") && User.user.hasPermission("edit-thing")
      }, x.toJSON())));
      el.data("result", x.toJSON());
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
        this.model.unset("selectedEventId");
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
      this.$(".dropdown-menu li .edit").on("click", _.bind(this.handleSearchResultEdit, this));
    },

    handleSearchResultEdit: function (e) {
      this.preventEventPropagation(e);
      var data = $(e.target).parent().parent().data().result;
      this.createThingEditor(data);
      Analytics.searchEntryEdited(data);
    },

    createThingEditor: function (data) {
      var thing = new Things.instance.model({id: data.thing_id}, {collection: Things.instance});
      when(thing.fetch()).then(_.bind(this._createThingEditor, this, thing));
    },

    _createThingEditor: function (thing) {
      return new ThingEditor({
        state: this.model,
        model: thing
      }).render();
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

      var currentHighlight = this.model.get("highlight");
      if (currentHighlight && currentHighlight.id === data.thing_id) {
        this.model.set("highlight", {});
        this.model.unset("selectedEventId");
      } else {
        var modelData = {};

        modelData.date = this.extractDate(data);
        modelData.highlight = this.getHighlightFromJSON(data);
        modelData.importance = this.extractImportance(data);

        this.setModelLocation(modelData, data);

        window.lastEvent = "search";
        this.setModelData(modelData);

        this.highlightSelectedResult();
      }
      Analytics.searchEntryClicked(data);
    },

    setModelLocation: function (modelData, data) {
      if (data.area.length === 1) {
        this.extractPointData(modelData, data);
      } else {
        this.extractBoundingBoxData(modelData, data);
      }
    },

    extractPointData: function (modelData, data) {
      modelData.center = [data.area[0].lat, data.area[0].lon];
      modelData.zoom = 12;
    },

    extractBoundingBoxData: function (modelData, data) {
      _.extend(modelData, Highlight.determineModelBounds(data.area));
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
        var newImportance = this.extractImportance(data);
        if (this.model.get("importance") > newImportance) {
          modelData.importance = newImportance;
        }
        this.model.set(modelData);
      }
    },

    getHighlightFromJSON: function (data) {
      var points;
      if (data.points) {
        points = data.points;
      } else {
        points = data.area;
        _.each(points, function (point) {
          point.importance_value = data.importance_value;
        });
      }
      return {
        id: data.thing_id,
        name: data.thing_name,
        link: data.thing_link,
        type: data.thing_type_name,
        points: points,
        area: data.area
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

    extractImportance: function (data) {
      return data.importance_value || _.reduce(data.points, function (memo, point) {
        return Math.min(memo, point.importance_value);
      }, 1000);
    },

    setModelData: function (modelData) {
      this.model.set(modelData, {silent: true});
      FilterUrlSerialiser.deserialise("", this.model);
      window.lastEvent = "search";
      this.model.trigger("change change:filterState change:date change:importance");
    }

  });

  return SearchBoxView;
});
