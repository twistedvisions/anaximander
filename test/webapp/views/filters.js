/*global sinon, describe, beforeEach, afterEach, it */
define(
  ["jquery", "underscore", "backbone", "views/filters"],
  function ($, _, Backbone, Filters) {
    var model = new Backbone.Model({
      center: [1, 1],
      date: [1900, 2000],
      zoom: 3,
      filterState: new Backbone.Collection()
    });

    var typesCollection = new Backbone.Collection();
    var subtypesCollection = new Backbone.Collection();
    subtypesCollection.setParentType = function () {};
    subtypesCollection.getParentType = function () {
      return new Backbone.Model({id: 1});
    };
    subtypesCollection.updateData = function (opts) {
      return this.fetch(opts);
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
          if (opts) {
            opts.success();
          }
        });
        this.filters = new Filters({
          model: model,
          typesCollection: typesCollection,
          subtypesCollection: subtypesCollection
        });

      });

      afterEach(function () {
        $("#filters-container").remove();
        subtypesCollection.fetch.restore();
      });

      describe("checkbox states", function () {

        it("shows check boxes for primary filters", function () {
          this.filters.render();
          this.filters.$el.find(".primary input[type=checkbox]").length.should.be.above(0);
        });

        it("shows check boxes for secondary filters", function () {
          this.filters.render();
          this.filters.showSecondaryFilters(typesCollection.get(1));
          this.filters.$el.find(".secondary input[type=checkbox]").length.should.be.above(0);
        });

        it("shows check boxes for not-specified secondary filters", function () {
          this.filters.render();
          this.filters.showSecondaryFilters(typesCollection.get(1));
          this.filters.$el.find(".secondary input[type=checkbox].not-specified").length.should.equal(1);
        });

        it("unsets not-specified filter when appropriate", function () {
          this.filters.model.get("filterState").set([{id: -1}]);
          this.filters.render();
          this.filters.showSecondaryFilters(typesCollection.get(1));
          this.filters.$el.find(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(false);
        });

        it("sets not-specified filter when it was off, but the primary is toggled", function () {
          this.filters.model.get("filterState").set([{id: -1}]);
          this.filters.render();
          this.filters.showSecondaryFilters(typesCollection.get(1));

          this.filters.$el.find(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(false);
          this.filters.checkPrimary(new Backbone.Model({id: 1}), false);
          this.filters.$el.find(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(false);
          this.filters.checkPrimary(new Backbone.Model({id: 1}), true);
          this.filters.$el.find(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(true);
        });

        it("doesn't unset not-specified filter when not in options", function () {
          this.filters.model.get("filterState").set([]);
          this.filters.render();
          this.filters.showSecondaryFilters(typesCollection.get(1));
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
          this.filters.showSecondaryFilters(typesCollection.get(1));
          this.filters.$el.find(".secondary input:checked.specified").length.should.equal(1);
        });

        it("selects all secondary filters when a primary filter is selected", function () {
          this.filters.model.get("filterState").set([{id: 3, parent_type: 1}]);
          this.filters.render();
          this.filters.showSecondaryFilters(typesCollection.get(1));
          this.filters.$el.find(".secondary input:checked").length.should.equal(2);
          this.filters.checkPrimary(new Backbone.Model({id: 1}), true);
          this.filters.$el.find(".secondary input:checked").length.should.equal(3);
        });

        it("deselects all secondary filters when a primary filter is deselected", function () {
          this.filters.model.get("filterState").set([{id: 3, parent_type: 1}]);
          this.filters.render();
          this.filters.showSecondaryFilters(typesCollection.get(1));
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
          this.filters.showSecondaryFilters(typesCollection.get(1));
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
          this.filters.showSecondaryFilters(typesCollection.get(1));
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
      });

      describe("filtering", function () {
        it("shows everything when nothing is typed in", function () {
          this.filters.render();
          this.filters.showSecondaryFilters(typesCollection.get(1));
          this.filters.$("#secondary-filter").val("");
          this.filters._filterSecondaryFilters();
          this.filters.$el.find(".secondary .filter:not([style*='display:'])").length.should.be.above(0);
        });
        it("filters the list when something is typed in", function () {
          this.filters.render();
          this.filters.showSecondaryFilters(typesCollection.get(1));
          this.filters.$("#secondary-filter").val("not going to be found");
          this.filters._filterSecondaryFilters();
          this.filters.$el.find(".secondary .filter:not([style*='display:'])").length.should.equal(0);
        });
        describe("toggle selection", function () {
          it("shows when something is typed in", function () {
            this.filters.render();
            this.filters.showSecondaryFilters(typesCollection.get(1));
            this.filters.$("#secondary-filter").val("");
            this.filters._filterSecondaryFilters();
            this.filters.$("#toggle-selection.visible").length.should.equal(0);
          });
          it("doesn't show when the filter box is empty", function () {
            this.filters.render();
            this.filters.showSecondaryFilters(typesCollection.get(1));
            this.filters.$("#secondary-filter").val("some filter string");
            this.filters._filterSecondaryFilters();
            this.filters.$("#toggle-selection.visible").length.should.equal(1);
          });

          describe("toggling visible filter selection", function () {
            beforeEach(function () {
              this.filters.render();
              this.filters.$el.show();
              this.filters.showSecondaryFilters(typesCollection.get(1));
              this.filters.$("#secondary-filter").val("name");
              this.filters._filterSecondaryFilters();
            });

            it("will select unselected visible filters", function () {
              this.filters.$(".secondary .filter:visible").length.should.equal(2);
              this.filters.$(".secondary .filter:visible:nth(0) input[type=checkbox]").prop("checked", false);
              this.filters.$(".secondary .filter:visible:nth(1) input[type=checkbox]").prop("checked", true);
              this.filters.$(".secondary .filter:visible input[type=checkbox]:checked").length.should.equal(1);
              this.filters.toggleVisible();
              this.filters.$(".secondary .filter:visible input[type=checkbox]:checked").length.should.equal(2);
            });
            it("will not select unselected invisible filters", function () {
              this.filters.$(".secondary .filter:visible").length.should.equal(2);
              this.filters.$(".secondary .filter:visible:nth(0) input[type=checkbox]").prop("checked", false);
              this.filters.$(".secondary .filter:visible:nth(1) input[type=checkbox]").prop("checked", false);
              this.filters.$(".secondary .filter:nth(1)").hide();
              this.filters.$(".secondary .filter input[type=checkbox]:checked").length.should.equal(0);
              this.filters.toggleVisible();
              this.filters.$(".secondary .filter input[type=checkbox]:checked").length.should.equal(1);
            });

            it("will unselect selected visible filters", function () {
              this.filters.$(".secondary .filter:visible").length.should.equal(2);
              this.filters.$(".secondary .filter:visible:nth(0) input[type=checkbox]").prop("checked", true);
              this.filters.$(".secondary .filter:visible:nth(1) input[type=checkbox]").prop("checked", false);
              this.filters.$(".secondary .filter:visible input[type=checkbox]:checked").length.should.equal(1);
              this.filters.toggleVisible();
              this.filters.$(".secondary .filter:visible input[type=checkbox]:checked").length.should.equal(0);
            });
            it("will not unselect selected invisible filters", function () {
              this.filters.$(".secondary .filter:visible").length.should.equal(2);
              this.filters.$(".secondary .filter:visible:nth(0) input[type=checkbox]").prop("checked", true);
              this.filters.$(".secondary .filter:visible:nth(1) input[type=checkbox]").prop("checked", true);
              this.filters.$(".secondary .filter:nth(1)").hide();
              this.filters.$(".secondary .filter input[type=checkbox]:checked").length.should.equal(2);
              this.filters.toggleVisible();
              this.filters.$(".secondary .filter input[type=checkbox]:checked").length.should.equal(1);
            });
          });
        });
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
          this.filters.showSecondaryFilters(typesCollection.get(1));
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
