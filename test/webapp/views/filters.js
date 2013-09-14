/*global sinon, describe, beforeEach, afterEach, it, google */
define(
  ["jquery", "backbone", "views/filters"], 
  function ($, Backbone, Filters) {
    var model = new Backbone.Model({
      center: [1, 1],
      date: [1900, 2000],
      zoom: 3
    });
    var collection = new Backbone.Collection();

    describe("rendering", function () {
      beforeEach(function () {
    

        $("body").append("<div id='filters-container'></div>");
        this.filters = new Filters({
          model: model,
          eventsCollection: collection
        });

      });

      afterEach(function () {
        $("body").remove("#filters-container");
      });

      it("shows check boxes for primary filters", function () {
        this.filters.render();
        this.filters.$el.find(".primary input[type=checkbox]").length.should.be.above(0);
      });

      it("shows check boxes for secondary filters", function () {
        this.filters.render();
        this.filters.showSecondaryFilters(this.filters.data[0]);
        this.filters.$el.find(".secondary input[type=checkbox]").length.should.be.above(0);
      });
    });
  }
);
