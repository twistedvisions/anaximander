/*global sinon, describe, beforeEach, afterEach, it */
define(
  ["jquery", "underscore", "backbone", "when",
    "collections/subtypes", "models/view_state", "views/filters"],
  function ($, _, Backbone, when, SubTypes, ViewState, Filters) {
    describe("filters", function () {
      beforeEach(function () {

        this.model = new ViewState({
          center: [1, 1],
          date: [1900, 2000],
          zoom: 3,
          filterState: new Backbone.Collection()
        });

        this.typesCollection = new Backbone.Collection();
        this.subtypesCollection = new SubTypes();
        this.subtypesCollection.updateData = function (opts) {
          var d = when.defer();
          this.fetch(opts);
          d.resolve();
          return {
            then: function (f) {
              f();
            }
          };
        };
        this.rolesCollection = new Backbone.Collection([
          {id: 1, name: "role 1"},
          {id: 2, name: "role 2"},
          {id: 3, name: "role 3"}
        ]);

      });

      describe("filter view", function () {
        beforeEach(function () {
          $("body").append("<div id='filters-container'></div>");

          this.typesCollection.reset([
            {
              id: 1,
              name: "name 1"
            }, {
              id: 2,
              name: "name 2"
            }
          ]);

          sinon.stub(this.subtypesCollection, "fetch", _.bind(function () {
            this.subtypesCollection.reset([
              {
                id: 3,
                name: "name 3"
              }, {
                id: 4,
                name: "name 4"
              }
            ]);
          }, this));
          this.filters = new Filters({
            model: this.model,
            typesCollection: this.typesCollection,
            subtypesCollection: this.subtypesCollection,
            rolesCollection: this.rolesCollection
          });

        });

        afterEach(function () {
          $("#filters-container").remove();
          this.subtypesCollection.fetch.restore();
        });

        describe("checkbox states", function () {

          it("shows check boxes for primary filters", function () {
            this.filters.render();
            this.filters.$(".primary input[type=checkbox]").length.should.equal(4);
          });

          describe("type based", function () {

            it("shows check boxes for secondary filters", function () {
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
              this.filters.$(".secondary input[type=checkbox]").length.should.equal(3);
            });

            it("shows check boxes for not-specified secondary filters", function () {
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
              this.filters.$(".secondary input[type=checkbox].not-specified").length.should.equal(1);
            });

            it("unsets not-specified filter when appropriate", function () {
              this.filters.model.get("filterState").set([{id: -1}]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
              this.filters.$(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(false);
            });

            it("sets not-specified filter when it was off, but the primary is toggled", function () {
              this.filters.model.get("filterState").set([{id: -1}]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));

              this.filters.$(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(false);
              this.filters.primaryFilterSelectionChanged(new Backbone.Model({id: 1}), false);
              this.filters.$(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(false);
              this.filters.primaryFilterSelectionChanged(new Backbone.Model({id: 1}), true);
              this.filters.$(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(true);
            });

            it("doesn't unset not-specified filter when not in options", function () {
              this.filters.model.get("filterState").set([]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
              this.filters.$(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(true);
            });

            it("doesn't select primary filters when state has them unselected", function () {
              this.filters.model.get("filterState").set([{id: 1}]);
              this.filters.render();
              this.filters.$(".primary .filter.type input:checked").length.should.equal(1);
            });

            it("doesn't select secondary filters when state has them unselected", function () {
              this.filters.model.get("filterState").set([{id: 3, parent_type: 1}]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
              this.filters.$(".secondary input:checked.specified").length.should.equal(1);
            });

            it("selects all secondary filters when a primary filter is selected", function () {
              this.filters.model.get("filterState").set([{id: 3, parent_type: 1}]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
              this.filters.$(".secondary input:checked").length.should.equal(2);
              this.filters.primaryFilterSelectionChanged(new Backbone.Model({id: 1}), true);
              this.filters.$(".secondary input:checked").length.should.equal(3);
            });

            it("deselects all secondary filters when a primary filter is deselected", function () {
              this.filters.model.get("filterState").set([{id: 3, parent_type: 1}]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
              this.filters.$(".secondary input:checked").length.should.equal(2);
              this.filters.primaryFilterSelectionChanged(new Backbone.Model({id: 1}), false);
              this.filters.$(".secondary input:checked").length.should.equal(0);
            });

            it("puts the primary checkbox in a half-state when not all secondary filters are selected", function () {
              this.filters.model.get("filterState").set([{id: 3, parent_type: 1}]);
              this.filters.render();
              this.filters.$(".primary input.half:checked").length.should.equal(1);
            });

            it("puts the primary checkbox in a selected state when all secondary filters are selected", function () {
              this.filters.model.get("filterState").set([{}]);
              this.filters.render();
              this.filters.$(".primary input.half:checked").length.should.equal(0);
              this.filters.$(".primary .filter.type input:checked").length.should.equal(2);
            });

            it("puts the primary checkbox in a unselected state when all secondary filters are unselected", function () {
              this.filters.model.get("filterState").set([
                {id: -1},
                {id: 4, parent_type: 1}
              ]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));

              this.filters.$(".primary input.half:checked").length.should.equal(1);
              this.filters.$(".primary .filter.type input:checked").length.should.equal(2);

              this.filters.secondaryFilters._checkSecondary(
                new Backbone.Model({id: 3, parent_type: 1}),
                {
                  currentTarget: $(this.filters.$(".secondary label").first().children()[0])
                }
              );

              this.filters.$(".primary input.half:checked").length.should.equal(0);
              this.filters.$(".primary .filter.type input:checked").length.should.equal(1);
            });

            it("puts the primary checkbox in a unselected state when all secondary filters are unselected when last selection is the notSelected", function () {
              this.filters.model.get("filterState").set([
                {id: 3, parent_type: 1},
                {id: 4, parent_type: 1}
              ]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));

              this.filters.$(".primary input.half:checked").length.should.equal(1);
              this.filters.$(".primary .filter.type input:checked").length.should.equal(2);

              this.filters.secondaryFilters._checkSecondary(
                new Backbone.Model({id: -1}),
                {
                  currentTarget: $($(this.filters.$(".secondary label")[1]).first().children()[0])
                }
              );

              this.filters.$(".primary input.half:checked").length.should.equal(0);
              this.filters.$(".primary .filter.type input:checked").length.should.equal(1);
            });

            it("puts the primary checkbox in a half state when unselect everything then select one secondary", function () {
              this.filters.model.get("filterState").set([
                {id: 1}
              ]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
              this.filters.$(".secondary input:checked").length.should.equal(0);
              this.filters.$(".secondary input").first().prop("checked", true);
              this.filters.secondaryFilters._checkSecondary(
                new Backbone.Model({id: 3, parent_type: 1}),
                {
                  currentTarget: $(this.filters.$(".secondary label").first().children()[0])
                }
              );
              this.filters.$(".primary input.half:checked").length.should.equal(1);
              this.filters.$(".primary .filter.type input:checked").length.should.equal(2);
            });
          });

          describe("non-type based", function () {

            it("shows check boxes for secondary filters", function () {
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters({id: "r"});
              this.filters.$(".secondary input[type=checkbox]").length.should.equal(4);
            });

            it("shows check boxes for not-specified secondary filters", function () {
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters({id: "r"});
              this.filters.$(".secondary input[type=checkbox].not-specified").length.should.equal(1);
            });

            it("unsets not-specified filter when appropriate", function () {
              this.filters.model.get("filterState").set([{id: "r.ns"}]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters({id: "r"});
              this.filters.$(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(false);
            });

            it("sets not-specified filter when it was off, but the primary is toggled", function () {
              this.filters.model.get("filterState").set([{id: "r.ns"}]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters({id: "r"});

              this.filters.$(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(false);
              this.filters.primaryFilterSelectionChanged(new Backbone.Model({id: "r"}), false);
              this.filters.$(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(false);
              this.filters.primaryFilterSelectionChanged(new Backbone.Model({id: "r"}), true);
              this.filters.$(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(true);
            });

            it("doesn't unset not-specified filter when not in options", function () {
              this.filters.model.get("filterState").set([]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters({id: "r"});
              this.filters.$(".secondary input[type=checkbox].not-specified").prop("checked").should.equal(true);
            });

            it("doesn't select primary filters when state has them unselected", function () {
              this.filters.model.get("filterState").set([{id: 1}]);
              this.filters.render();
              this.filters.$(".primary .filter.type input:checked").length.should.equal(1);
            });

            it("doesn't select secondary filters when state has them unselected", function () {
              this.filters.model.get("filterState").set([{id: "r3", parent_type: "r"}]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters({id: "r"});
              this.filters.$(".secondary input:checked.specified").length.should.equal(2);
            });

            it("selects all secondary filters when a primary filter is selected", function () {
              this.filters.model.get("filterState").set([{id: "r3", parent_type: "r"}]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters({id: "r"});
              this.filters.$(".secondary input:checked").length.should.equal(3);
              this.filters.primaryFilterSelectionChanged(new Backbone.Model({id: "r"}), true);
              this.filters.$(".secondary input:checked").length.should.equal(4);
            });

            it("deselects all secondary filters when a primary filter is deselected", function () {
              this.filters.model.get("filterState").set([{id: "r3", parent_type: "r"}]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters({id: "r"});
              this.filters.$(".secondary input:checked").length.should.equal(3);
              this.filters.primaryFilterSelectionChanged(new Backbone.Model({id: "r"}), false);
              this.filters.$(".secondary input:checked").length.should.equal(0);
            });

            it("puts the primary checkbox in a half-state when not all secondary filters are selected", function () {
              this.filters.model.get("filterState").set([{id: "r3", parent_type: "r"}]);
              this.filters.render();
              this.filters.$(".primary input.half:checked").length.should.equal(1);
            });

            it("puts the primary checkbox in a selected state when all secondary filters are selected", function () {
              this.filters.model.get("filterState").set([{}]);
              this.filters.render();
              this.filters.$(".primary input.half:checked").length.should.equal(0);
              this.filters.$(".primary .filter.special input:checked").length.should.equal(2);
            });

            it("puts the primary checkbox in a unselected state when all secondary filters are unselected", function () {
              this.filters.model.get("filterState").set([
                {id: "r.ns"},
                {id: "r1", parent_type: "r"},
                {id: "r2", parent_type: "r"}
              ]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters({id: "r"});

              this.filters.$(".primary input.half:checked").length.should.equal(1);
              this.filters.$(".primary .filter.special input:checked").length.should.equal(2);

              this.filters.secondaryFilters._checkSecondary(
                new Backbone.Model({id: 3}),
                {
                  currentTarget: $(this.filters.$(".secondary label").children()[0])
                }
              );
              this.filters.$(".primary input.half:checked").length.should.equal(0);
              this.filters.$(".primary .filter.special input:checked").length.should.equal(1);
            });

            it("puts the primary checkbox in a unselected state when all secondary filters are unselected when last selection is the notSelected", function () {
              this.filters.model.get("filterState").set([
                {id: "r1", parent_type: "r"},
                {id: "r2", parent_type: "r"},
                {id: "r3", parent_type: "r"}
              ]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters({id: "r"});

              this.filters.$(".primary input.half:checked").length.should.equal(1);
              this.filters.$(".primary .filter.special input:checked").length.should.equal(2);

              this.filters.secondaryFilters._checkSecondary(
                new Backbone.Model({id: ".ns"}),
                {
                  currentTarget: $($(this.filters.$(".secondary label")[1]).children()[0])
                }
              );
              this.filters.$(".primary input.half:checked").length.should.equal(0);
              this.filters.$(".primary .filter.special input:checked").length.should.equal(1);
            });

            it("puts the primary checkbox in a half state when unselect everything then select one secondary", function () {
              this.filters.model.get("filterState").set([
                {id: "r"}
              ]);
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters({id: "r"});
              this.filters.$(".secondary input:checked").length.should.equal(0);
              this.filters.$(".secondary input").first().prop("checked", true);
              this.filters.secondaryFilters._checkSecondary(
                new Backbone.Model({id: 3}),
                {
                  currentTarget: $(this.filters.$(".secondary label").first().children()[0])
                }
              );
              this.filters.$(".primary input.half:checked").length.should.equal(1);
              this.filters.$(".primary .filter.special input:checked").length.should.equal(2);
            });
          });

        });

        describe("filtering", function () {
          it("shows everything when nothing is typed in", function () {
            this.filters.render();
            this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
            this.filters.$("#secondary-filter").val("");
            this.filters.secondaryFilters.filterSecondaryFilters();
            this.filters.$(".secondary .filter:not([style*='display:'])").length.should.be.above(0);
          });
          it("filters the list when something is typed in", function () {
            this.filters.render();
            this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
            this.filters.$("#secondary-filter").val("not going to be found");
            this.filters.secondaryFilters.filterSecondaryFilters();
            this.filters.$(".secondary .filter:not([style*='display:'])").length.should.equal(0);
          });
          describe("toggle selection", function () {
            it("shows when something is typed in", function () {
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
              this.filters.$("#secondary-filter").val("");
              this.filters.secondaryFilters.filterSecondaryFilters();
              this.filters.$("#toggle-selection.visible").length.should.equal(0);
            });
            it("doesn't show when the filter box is empty", function () {
              this.filters.render();
              this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
              this.filters.$("#secondary-filter").val("some filter string");
              this.filters.secondaryFilters.filterSecondaryFilters();
              this.filters.$("#toggle-selection.visible").length.should.equal(1);
            });

            describe("toggling visible filter selection", function () {
              beforeEach(function () {
                this.filters.render();
                this.filters.$el.show();
                this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
                this.filters.$("#secondary-filter").val("name");
                this.filters.secondaryFilters.filterSecondaryFilters();
              });

              it("will select unselected visible filters", function () {
                this.filters.$(".secondary .filter:visible").length.should.equal(2);
                this.filters.$(".secondary .filter:visible:nth(0) input[type=checkbox]").prop("checked", false);
                this.filters.$(".secondary .filter:visible:nth(1) input[type=checkbox]").prop("checked", true);
                this.filters.$(".secondary .filter:visible input[type=checkbox]:checked").length.should.equal(1);
                this.filters.secondaryFilters.toggleVisibleCheckboxes();
                this.filters.$(".secondary .filter:visible input[type=checkbox]:checked").length.should.equal(2);
              });
              it("will not select unselected invisible filters", function () {
                this.filters.$(".secondary .filter:visible").length.should.equal(2);
                this.filters.$(".secondary .filter:visible:nth(0) input[type=checkbox]").prop("checked", false);
                this.filters.$(".secondary .filter:visible:nth(1) input[type=checkbox]").prop("checked", false);
                this.filters.$(".secondary .filter:nth(1)").hide();
                this.filters.$(".secondary .filter input[type=checkbox]:checked").length.should.equal(1);
                this.filters.secondaryFilters.toggleVisibleCheckboxes();
                this.filters.$(".secondary .filter input[type=checkbox]:checked").length.should.equal(2);
              });

              it("will unselect selected visible filters", function () {
                this.filters.$(".secondary .filter:visible").length.should.equal(2);
                this.filters.$(".secondary .filter:visible:nth(0) input[type=checkbox]").prop("checked", true);
                this.filters.$(".secondary .filter:visible:nth(1) input[type=checkbox]").prop("checked", false);
                this.filters.$(".secondary .filter:visible input[type=checkbox]:checked").length.should.equal(1);
                this.filters.secondaryFilters.toggleVisibleCheckboxes();
                this.filters.$(".secondary .filter:visible input[type=checkbox]:checked").length.should.equal(0);
              });
              it("will not unselect selected invisible filters", function () {
                this.filters.$(".secondary .filter:visible").length.should.equal(2);
                this.filters.$(".secondary .filter:visible:nth(0) input[type=checkbox]").prop("checked", true);
                this.filters.$(".secondary .filter:visible:nth(1) input[type=checkbox]").prop("checked", true);
                this.filters.$(".secondary .filter:nth(1)").hide();
                this.filters.$(".secondary .filter input[type=checkbox]:checked").length.should.equal(3);
                this.filters.secondaryFilters.toggleVisibleCheckboxes();
                this.filters.$(".secondary .filter input[type=checkbox]:checked").length.should.equal(2);
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
            this.filters.secondaryFilters.showSecondaryFilters(this.typesCollection.get(1));
            this.filters.model.get("filterState").length.should.equal(0);
            this.filters.primaryFilterSelectionChanged(new Backbone.Model({id: 1}), false);
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

        describe("events", function () {
          it("triggers an event when you click a primary", function () {
            this.filters.model.get("filterState").set([]);
            this.filters.render();
            var called = false;
            this.filters.model.on("change:filterState", function () {
              called = true;
            });
            this.filters.secondaryFilters.setDefaultCollection();
            this.filters.primaryFilterSelectionChanged(new Backbone.Model({id: 1}), false);
            called.should.equal(true);
          });
          it("triggers an event when you click a secondary", function () {
            this.filters.model.get("filterState").set([]);
            this.filters.render();
            var called = false;
            this.filters.model.on("change:filterState", function () {
              called = true;
            });
            this.filters.secondaryFilters.setDefaultCollection();
            this.filters.secondaryFilters._checkSecondary(
              new Backbone.Model({id: 3, parent_type: 1}),
              {
                currentTarget: $(this.filters.$(".secondary label").first().children()[0])
              }
            );
            called.should.equal(true);
          });
        });
      });
    });
  }
);
