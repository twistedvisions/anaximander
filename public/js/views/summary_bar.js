define([
  "jquery",
  "underscore",
  "backbone",
  "select2",
  "views/login",
  "utils/filter_url_serialiser",
  "models/current_user",
  "analytics",
  "text!templates/summary_bar.htm",
  "less!../../css/summary_bar",
  "less!../../css/select2-bootstrap"
], function ($, _, Backbone, Select2, Login, FilterUrlSerialiser, User,
    analytics, template) {

  var SummaryBar = Backbone.View.extend({
    el: "#summary-bar",

    data: {
      1: {
        id: 1,
        text: "Victorian England",
        link: "http://en.wikipedia.org/wiki/Victorian_era",
        place: {
          center: [52.264713902112014, 0.5846995246856856],
          zoom: 7,
          date: [1837, 1901]
        }
      },
      2: {
        id: 2,
        text: "American frontier",
        link: "http://en.wikipedia.org/wiki/American_frontier",
        place: {
          center: [40.28361442093428, -104.2341023312701],
          zoom: 5,
          date: [1700, 1850]
        }
      },
      3: {
        id: 3,
        text: "The crusades",
        link: "http://en.wikipedia.org/wiki/Crusades",
        place: {
          center: [39.25854681598296, 15.493256433539662],
          zoom: 5,
          date: [1090, 1300]
        }
      },
      4: {
        id: 4,
        text: "The Age of Enlightenment",
        link: "http://en.wikipedia.org/wiki/Age_of_Enlightenment",
        place: {
          center: [52.79023488716538, 13.929863725206282],
          zoom: 5,
          date: [1630, 1750]
        }
      },
      5: {
        id: 5,
        text: "World War II - Western Theatre",
        link: "http://en.wikipedia.org/wiki/World_War_II",
        place: {
          center: [49.43109536582428, 10.431494519476798],
          zoom: 5,
          date: [1938, 1945],
          filters: "1:*;2:*;3:u,5,12,14,8,6,7;4:*"
        }
      },
      6: {
        id: 6,
        text: "The Classical Period",
        link: "http://en.wikipedia.org/wiki/Classical_Greece",
        place: {
          center: [37.51250057352118, 19.418217102810722],
          zoom: 5,
          date: [-550, -200]
        }
      },
      7: {
        id: 7,
        text: "Silicon Valley",
        link: "http://en.wikipedia.org/wiki/Silicon_Valley",
        place: {
          center: [37.51735873697871, -122.04311712570482],
          zoom: 9,
          date: [1970, 2013],
          filters: "1:*;2:u,93,29,35,107,101,77,55,95,45,32,74,102,80,62,87,60,96,54,99,97,41,106,61,65,49,89,75,90,100,73,94,36,46,58,92,108,109,50,44,71,70,52,83,69,68,26,59,66;3:*;4:*"
        }
      }
    },

    initialize: function (opts) {
      this.eventLocationsCollection = opts.eventLocationsCollection;
    },

    render: function () {
      this.$el.html(template);
      setTimeout(_.bind(this.showSelector, this), 100);

      if (User.user.hasPermission("login")) {
        this.login = new Login();
        this.login.render();//.appendTo(this.$("#login-holder"));
      }

      this.eventLocationsCollection.on("reset", this.showStats, this);
      this.$("#filter-toggle").on("click", _.bind(this.showFilters, this));
      this.model.on("change", this.setFilterButtonHighlighting, this);
      this.setFilterButtonHighlighting();
    },

    setFilterButtonHighlighting: function () {
      if (this.model.get("filterState").length > 0) {
        this.$("#filter-toggle").addClass("highlight");
      } else {
        this.$("#filter-toggle").removeClass("highlight");
      }
    },

    showFilters: function () {
      analytics.showFilters();
      $("body").toggleClass("filters-visible");
      $(window).trigger("resize");
      this.model.trigger("force-change filter-view-change");
    },

    showSelector: function () {

      this.placeSelector = this.$el.find("#place-selector");
      this.placeSelector.select2({
        placeholder: "Explore a period",
        data: _.values(this.data)
      });

      this.placeSelector.on("select2-open", _.bind(this.placeSelectorOpened, this));
      this.placeSelector.on("change", _.bind(this.handleChange, this));
    },

    placeSelectorOpened: function () {
      analytics.periodSelectorOpened();
    },

    handleChange: function () {
      window.lastEvent = "period_selector";
      var id = this.placeSelector.select2("val");
      analytics.periodSelected(this.data[id]);
      var place = this.data[id].place;
      var data = _.extend({
        query: "",
        highlight: {}
      }, this.data[id].place);
      this.model.set(data, {silent: true});
      FilterUrlSerialiser.deserialise(place.filters || "", this.model);
      window.lastEvent = "period_selector";
      this.model.trigger("change change:filterState change:date change:query  ");
    },

    showStats: function () {
      var results = this.eventLocationsCollection.lastResults;
      this.$el.find("#locations-shown").text(this.getLocationCount(results));
      this.$el.find("#events-shown").text(this.getEventCount(results));
    },

    getLocationCount: function (results) {
      return results.length;
    },

    getEventCount: function (results) {
      return _(results)
        .map(function (events) {
          return events.length;
        })
        .reduce(function (a, b) {
          return a + b;
        }) || 0;
    }

  });

  return SummaryBar;
});