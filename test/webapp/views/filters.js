/*global sinon, describe, beforeEach, afterEach, it, google */
define(
  ["jquery", "underscore", "backbone", "views/filters"], 
  function ($, _, Backbone, Filters) {
    var model = new Backbone.Model({
      center: [1, 1],
      date: [1900, 2000],
      zoom: 3,
      filterState: new Backbone.Collection()
    });
    var eventsCollection = new Backbone.Collection();
    var typesCollection = new Backbone.Collection();
    var subtypesCollection = new Backbone.Collection();
    subtypesCollection.setParentType = function () {};
    subtypesCollection.getParentType = function () {
      return new Backbone.Model({id: 1});
    };
    
    describe("filter view", function () {
      beforeEach(function () {
        $("body").append("<div id='filters-container'></div>");
        
        typesCollection.reset([
          {
            id: 1,
            name: "name 1"
          }, {
            id: 2,
            name: "name 2"
          }
        ]);

        sinon.stub(subtypesCollection, "fetch", function (opts) {
          subtypesCollection.reset([
            {
              id: 3,
              name: "name 3"
            }, {
              id: 4,
              name: "name 4"
            }
          ]);
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

      it("shows check boxes for not-specified secondary filters", function () {
        this.filters.render();
        this.filters.showSecondaryFilters(subtypesCollection.get(1));
        this.filters.$el.find(".secondary input[type=checkbox].not-specified").length.should.equal(1);
      });

      it("unsets not-specified filter when appropriate", function () {
        this.filters.model.get("filterState").set([{id: -1}]);
        this.filters.render();
        this.filters.showSecondaryFilters(subtypesCollection.get(1));
        this.filters.$el.find(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(false);
      });

      it("doesn't unset not-specified filter when not in options", function () {
        this.filters.model.get("filterState").set([]);
        this.filters.render();
        this.filters.showSecondaryFilters(subtypesCollection.get(1));
        this.filters.$el.find(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(true);
      });

      it("doesn't select primary filters when state has them unselected", function () {
        this.filters.model.get("filterState").set([{id: 1}]);
        this.filters.render();
        this.filters.$el.find(".primary input:checked").length.should.equal(1);
      });

      it("doesn't select secondary filters when state has them unselected", function () {
        this.filters.model.get("filterState").set([{id: 3, parent_type: 1}]);
        this.filters.render();
        this.filters.showSecondaryFilters(subtypesCollection.get(1));
        this.filters.$el.find(".secondary input:checked.specified").length.should.equal(1);
      });

      it("selects all secondary filters when a primary filter is selected", function () {
        this.filters.model.get("filterState").set([{id: 3, parent_type: 1}]);
        this.filters.render();
        this.filters.showSecondaryFilters(subtypesCollection.get(1));
        this.filters.$el.find(".secondary input:checked").length.should.equal(2);
        this.filters.checkPrimary(new Backbone.Model({id: 1}), true);
        this.filters.$el.find(".secondary input:checked").length.should.equal(3);
      });

      it("deselects all secondary filters when a primary filter is deselected", function () {
        this.filters.model.get("filterState").set([{id: 3, parent_type: 1}]);
        this.filters.render();
        this.filters.showSecondaryFilters(subtypesCollection.get(1));
        this.filters.$el.find(".secondary input:checked").length.should.equal(2);
        this.filters.checkPrimary(new Backbone.Model({id: 1}), false);
        this.filters.$el.find(".secondary input:checked").length.should.equal(0);
      });

      it("puts the primary checkbox in a half-state when not all secondary filters are selected", function () {
        this.filters.model.get("filterState").set([{id: 3, parent_type: 1}]);
        this.filters.render();
        this.filters.$el.find(".primary input.half:checked").length.should.equal(1);
      });

      it("puts the primary checkbox in a selected state when all secondary filters are selected", function () {
        this.filters.model.get("filterState").set([{}]);
        this.filters.render();
        this.filters.$el.find(".primary input.half:checked").length.should.equal(0);
        this.filters.$el.find(".primary input:checked").length.should.equal(2);
      });

      it("puts the primary checkbox in a unselected state when all secondary filters are unselected", function () {
        this.filters.model.get("filterState").set([
          {id: -1},
          {id: 3, parent_type: 1},
          {id: 4, parent_type: 1}
        ]);
        this.filters.render();
        this.filters.showSecondaryFilters(subtypesCollection.get(1));
        this.filters.checkSecondary(
          new Backbone.Model({id: 3, parent_type: 1}), 
          {
            currentTarget: $(this.filters.$el.find(".secondary label").first().children()[0])
          }
        );
        this.filters.$el.find(".primary input.half:checked").length.should.equal(0);
        this.filters.$el.find(".primary input:checked").length.should.equal(1);
      });

      it("puts the primary checkbox in a half state when unselect everything then select one secondary", function () {
        this.filters.model.get("filterState").set([
          {id: 1}
        ]);
        this.filters.render();
        this.filters.showSecondaryFilters(subtypesCollection.get(1));
        this.filters.$el.find(".secondary input:checked").length.should.equal(0);
        this.filters.$el.find(".secondary input").first().prop("checked", true);
        this.filters.checkSecondary(
          new Backbone.Model({id: 3, parent_type: 1}), 
          {
            currentTarget: $(this.filters.$el.find(".secondary label").first().children()[0])
          }
        );
        this.filters.$el.find(".primary input.half:checked").length.should.equal(1);
        this.filters.$el.find(".primary input:checked").length.should.equal(2);
      });

      describe("serialisation", function () {

        it("returns empty if nothing is filtered out", function () {
          this.filters.model.get("filterState").set([]);
          this.filters.render();
          this.filters.model.get("filterState").length.should.equal(0);
        });

        it("returns a single filter if one primary is unselected", function () {
          this.filters.model.get("filterState").set([]);
          this.filters.render();
          this.filters.showSecondaryFilters(subtypesCollection.get(1));
          this.filters.model.get("filterState").length.should.equal(0);
          this.filters.checkPrimary(new Backbone.Model({id: 1}), false);
          this.filters.model.get("filterState").length.should.equal(1);
        });

        it("returns a single filter if one secondary is unselected", function () {
          this.filters.model.get("filterState").set([
            {id: 3, parent_type: 1}
          ]);
          this.filters.render();
          this.filters.model.get("filterState").length.should.equal(1);
        });

      });
    });
  }
);
