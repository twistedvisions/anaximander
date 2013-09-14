define([
  "jquery",
  "underscore",
  "backbone",
  "select2",
  "./filters",
  "text!templates/summary_bar.htm"
], function ($, _, Backbone, Select2, Filters, template) {

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
          date: [1938, 1945]
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
      }
    },

    initialize: function (opts) {      
      this.eventsCollection = opts.eventsCollection;
    },

    render: function () {
      this.$el.html(template);
      setTimeout(_.bind(this.showSelector, this), 100);
      this.filters = new Filters({
        model: this.model,
        eventsCollection: this.eventsCollection
      });

      this.eventsCollection.on("reset", this.showStats, this);
      this.$("#filter-toggle").on("click", _.bind(this.showFilters, this));

      //TODO: remove
      $("body").toggleClass("filters-visible");
    },

    showFilters: function () {
      $("body").toggleClass("filters-visible");
    },

    showSelector: function () {
      
      this.placeSelector = this.$el.find("#place-selector");
      this.placeSelector.select2({
        placeholder: "Explore a period",
        data: _.values(this.data)
      });
      this.placeSelector.on("change", _.bind(this.handleChange, this));
    },

    handleChange: function () {
      window.lastEvent = "period_selector";
      var id = this.placeSelector.select2("val");
      this.model.set(this.data[id].place);
    },

    showStats: function () {
      var results = this.eventsCollection.lastResults;
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