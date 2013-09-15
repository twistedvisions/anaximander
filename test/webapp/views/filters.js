/*global sinon, describe, beforeEach, afterEach, it, google */
define(
  ["jquery", "backbone", "views/filters"], 
  function ($, Backbone, Filters) {
    var model = new Backbone.Model({
      center: [1, 1],
      date: [1900, 2000],
      zoom: 3
    });
    var eventsCollection = new Backbone.Collection();
    var typesCollection = new Backbone.Collection();
    var subtypesCollection = new Backbone.Collection();
    subtypesCollection.setParentType = function () {};
    describe("rendering", function () {
      beforeEach(function () {
        $("body").append("<div id='filters-container'></div>");
        
       typesCollection.reset([{
          id: 1,
          name: "name 1"
        }]);

        sinon.stub(subtypesCollection, "fetch", function (opts) {
          subtypesCollection.reset([{
            id: 1,
            name: "name 1"
          }]);
          opts.success();
        });
        this.filters = new Filters({
          model: model,
          eventsCollection: eventsCollection,
          typesCollection: typesCollection,
          subtypesCollection: subtypesCollection
        });

      });

      afterEach(function () {
        $("body").remove("#filters-container");
        subtypesCollection.fetch.restore();
      });

      it("shows check boxes for primary filters", function () {
        this.filters.render();
        this.filters.$el.find(".primary input[type=checkbox]").length.should.be.above(0);
      });

      it("shows check boxes for secondary filters", function () {
        this.filters.render();
        this.filters.showSecondaryFilters(subtypesCollection.get(1));
        this.filters.$el.find(".secondary input[type=checkbox]").length.should.be.above(0);
      });
    });
  }
);
