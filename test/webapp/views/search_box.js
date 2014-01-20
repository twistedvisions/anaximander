/*global sinon, describe, it, beforeEach, afterEach */
define(
  ["jquery", "backbone", "views/search_box", "utils/filter_url_serialiser"],
  function ($, Backbone, SearchBox, FilterUrlSerialiser) {
    describe("search box", function () {
      beforeEach(function () {
        this.searchBox = new SearchBox({
          el: null,
          model: new Backbone.Model()
        });
      });
      afterEach(function () {
        if (this.el) {
          this.el.remove();
        }
      });
      describe("interaction", function () {
        it("should submit a request when the form is submitted", function () {
          sinon.stub(this.searchBox, "handleSearchSubmit", function (e) {
            e.preventDefault();
          });
          this.el = this.searchBox.render();
          this.el.find("form").trigger("submit");
          this.searchBox.handleSearchSubmit.calledOnce.should.equal(true);
        });
        it("should submit a request when the search-button is clicked", function () {
          sinon.stub(this.searchBox, "handleSearchSubmit", function (e) {
            e.preventDefault();
          });
          this.el = this.searchBox.render();
          this.el.find(".search-button").trigger("click");
          this.searchBox.handleSearchSubmit.calledOnce.should.equal(true);
        });
        it("should show a loading image when the form is submitted", function () {
          sinon.stub(this.searchBox, "handleSearchSubmit", function (e) {
            e.preventDefault();
          });
          this.el = this.searchBox.render();
          this.el.find("form").trigger("submit");
          this.searchBox.$el.hasClass("loading");
        });
        it("should focus the input when loaded", function () {
          try {
            this.el = this.searchBox.render();
            this.el.appendTo(document.body);
            var focused = false;
            this.el.find("#search").focus(function () {
              focused = true;
            });
            this.el.find("#search").focus();
            focused.should.equal(true);
          } finally {
            this.el.remove();
          }
        });

        it("should do nothing when the bootstrap triggers a hide dropdown message", function () {
          sinon.spy(this.searchBox, "bsHideSearchResults");

          this.parentEl = $("<div id='search-box'></div>");
          this.parentEl.appendTo(document.body);
          this.el = this.searchBox.render();
          this.el.appendTo(this.parentEl);
          try {
            this.searchBox.bsHideSearchResults.calledOnce.should.equal(false);
            var stub = sinon.stub();
            $("#search-box").on("hidden.bs.dropdown", stub);
            this.searchBox.dropdownVisible = true;
            $("#search-box").trigger("hide.bs.dropdown");
            this.searchBox.bsHideSearchResults.calledOnce.should.equal(true);
            stub.calledOnce.should.equal(false);
          } finally {
            this.parentEl.remove();
          }
        });

        it("should do nothing when the bootstrap triggers a show dropdown message", function () {
          sinon.spy(this.searchBox, "bsShowSearchResults");

          this.parentEl = $("<div id='search-box'></div>");
          this.parentEl.appendTo(document.body);
          this.el = this.searchBox.render();
          this.el.appendTo(this.parentEl);
          try {
            this.searchBox.bsShowSearchResults.calledOnce.should.equal(false);
            var stub = sinon.stub();
            $("#search-box").on("shown.bs.dropdown", stub);
            this.searchBox.dropdownVisible = true;
            $("#search-box").trigger("show.bs.dropdown");
            this.searchBox.bsShowSearchResults.calledOnce.should.equal(true);
            stub.calledOnce.should.equal(false);
          } finally {
            this.parentEl.remove();
          }
        });

        it("should listen to query change events on the model", function () {
          sinon.stub(this.searchBox, "updateQuery");
          this.searchBox.render();
          this.searchBox.updateQuery.reset();
          this.searchBox.updateQuery.calledOnce.should.equal(false);
          this.searchBox.model.set("query", "something");
          this.searchBox.updateQuery.calledOnce.should.equal(true);
        });

        it("should update its visual state when it loads", function () {
          sinon.stub(this.searchBox, "updateQuery");
          this.searchBox.render();
          this.searchBox.updateQuery.calledOnce.should.equal(true);
        });
      });

      describe("updateQuery", function () {
        it("should set the query string if it is set", function () {
          this.searchBox.model.set("query", "");
          this.searchBox.render();
          this.searchBox.$("#search").val().should.equal("");
          this.searchBox.model.set("query", "some value");
          this.searchBox.updateQuery();
          this.searchBox.$("#search").val().should.equal("some value");
        });
        it("should clear the query string if it is not set", function () {
          this.searchBox.model.set("query", "some value");
          this.searchBox.render();
          this.searchBox.$("#search").val().should.equal("some value");
          this.searchBox.model.set("query", "");
          this.searchBox.updateQuery();
          this.searchBox.$("#search").val().should.equal("");
        });
        it("search for the query if it is set", function () {
          this.searchBox.render();
          this.searchBox.model.set("query", "some value");
          sinon.stub(this.searchBox, "search");
          this.searchBox.updateQuery();
          this.searchBox.search.calledOnce.should.equal(true);
        });
        it("should hide the search results if the query string is not set", function () {
          this.searchBox.render();
          this.searchBox.model.set("query", "");
          sinon.stub(this.searchBox, "hideSearchResults");
          this.searchBox.updateQuery();
          this.searchBox.hideSearchResults.calledOnce.should.equal(true);
        });
      });

      describe("handleBodyResize", function () {
        it("should resize itself based on the map's size, minus any padding", function () {
          var height;
          sinon.stub(this.searchBox, "$", function (query) {
            if (query === ".search-results") {
              return {
                outerHeight: function () {
                  return 100;
                },
                innerHeight: function () {
                  return 80;
                },
                css: function (key, value) {
                  if (key === "height") {
                    height = value;
                  }
                }
              };
            }
          });
          sinon.stub(this.searchBox, "getMapHolder", function () {
            return {
              height: function () {
                return 200;
              }
            };
          });
          this.searchBox.handleBodyResize();
          height.should.equal(180);
        });
      });
      describe("searchSubmit", function () {
        beforeEach(function () {
          this.el = this.searchBox.render();
          this.el.appendTo(document.body);
          this.searchBox.$.get = sinon.stub();
          sinon.stub(this.searchBox, "doSearch");
        });
        it("should send the text in the input to the search request", function () {
          this.searchBox.$("#search").val("some search string");
          this.searchBox.handleSearchSubmit({preventDefault: function () {}});
          this.searchBox.doSearch.calledWith("some search string").should.equal(true);
        });
        it("should prevent the event from propagating", function () {
          var called = false;
          this.searchBox.handleSearchSubmit({preventDefault: function () {
            called = true;
          }});
          called.should.equal(true);
        });
        it("should set the model", function () {
          this.searchBox.$("#search").val("some search string");
          this.searchBox.handleSearchSubmit({preventDefault: function () {}});
          this.searchBox.model.get("query").should.equal("some search string");
        });
      });
      describe("searchResults", function () {
        beforeEach(function () {
          this.searchEntry = {
            thing_name: "thing_name",
            thing_link: "http://somewhere.com",
            thing_type_name: "thing_type_name",
            end_date: new Date(1901, 0, 2),
            start_date: new Date(1901, 0, 1),
            event_count: 2
          };
        });
        describe("formatResults", function () {
          it("should convert the start date to a JS date", function () {
            this.searchBox.formatResults({
              start_date: "1900-01-01"
            }).start_date.should.eql(new Date(1900, 0, 1));
          });
          it("should convert the end date to a JS date", function () {
            this.searchBox.formatResults({
              end_date: "1900-01-01"
            }).end_date.should.eql(new Date(1900, 0, 1));
          });
        });
        describe("generateSearchEntry", function () {
          it("should store the result in the drop down's data", function () {
            var el = this.searchBox.generateSearchEntry(this.searchEntry);
            el.data("result").should.equal(this.searchEntry);
          });
        });
        describe("renderSearchEntries", function () {
          it("should put a summary at the top", function () {
            var el = $("<div class=\"new-el-class\"></div>");
            var sb_el = this.searchBox.render();
            sb_el.appendTo(document.body);
            try {
              this.searchBox.renderSearchEntries([el]);
              this.searchBox.$(".dropdown-menu .search-summary").length.should.equal(1);
            } finally {
              sb_el.remove();
            }
          });
          it("should add the entries to the drop down", function () {
            var el = $("<div class=\"new-el-class\"></div>");
            var sb_el = this.searchBox.render();
            sb_el.appendTo(document.body);
            try {
              this.searchBox.renderSearchEntries([el]);
              this.searchBox.$(".dropdown-menu .new-el-class").length.should.equal(1);
            } finally {
              sb_el.remove();
            }
          });
        });
        describe("bindEventsToSearchEntries", function () {
          it("should bind events to clicking on the drop down", function () {
            sinon.stub(this.searchBox, "resultSelected");
            this.searchBox.render();
            this.searchBox.$(".dropdown-menu").html("<li class='search-result'/>");
            this.searchBox.bindEventsToSearchEntries();
            this.searchBox.$(".dropdown-menu li").click();
            this.searchBox.resultSelected.calledOnce.should.equal(true);
          });
          it("should prevent clicking on links from closing the dropdown", function () {
            sinon.spy(this.searchBox, "preventEventPropagation");
            sinon.stub(this.searchBox, "resultSelected");
            this.searchBox.render();
            this.searchBox.$(".dropdown-menu").html("<li><div class='name'><a>text</a></div></li>");
            this.searchBox.bindEventsToSearchEntries();
            this.searchBox.$(".dropdown-menu li a").click();
            this.searchBox.resultSelected.calledOnce.should.equal(false);
            this.searchBox.preventEventPropagation.calledOnce.should.equal(true);
          });
          it("should hide the search box when the close button is clicked", function () {
            sinon.stub(this.searchBox, "hideSearchResults");
            sinon.stub(this.searchBox, "resultSelected");
            this.searchBox.render();
            this.searchBox.$(".dropdown-menu").html("<li><div class='hide-button'><a>text</a></div></li>");
            this.searchBox.bindEventsToSearchEntries();
            //it will have been called once when it renders if no query in the model
            this.searchBox.hideSearchResults.reset();
            this.searchBox.hideSearchResults.calledOnce.should.equal(false);
            this.searchBox.$(".dropdown-menu li a").click();
            this.searchBox.hideSearchResults.calledOnce.should.equal(true);
          });
        });
        describe("showSearchResults", function () {
          afterEach(function () {
            $("body").removeClass("search-visible");
          });
          it("should set a variable flagging it is open after showing the dropdown", function () {
            this.searchBox.dropdownVisible = false;
            this.searchBox.showSearchResults();
            this.searchBox.dropdownVisible.should.equal(true);
          });
          it("should not show the drop down if it is already visible", function () {
            this.searchBox.dropdownVisible = true;
            sinon.stub(this.searchBox, "_showSearchResults");
            this.searchBox.showSearchResults();
            this.searchBox._showSearchResults.calledOnce.should.equal(false);
          });
          it("should add the 'search-visible' class to the body", function () {
            this.searchBox.showSearchResults();
            $("body.search-visible").length.should.equal(1);
          });
          it("should call handleBodyResize", function () {
            sinon.stub(this.searchBox, "handleBodyResize");
            this.searchBox.showSearchResults();
            this.searchBox.handleBodyResize.calledOnce.should.equal(true);
          });
          it("should call toggleDropdown", function () {
            sinon.stub(this.searchBox, "toggleDropdown");
            this.searchBox.showSearchResults();
            this.searchBox.toggleDropdown.calledOnce.should.equal(true);
          });
          it("should force the model to be changed", function () {
            var called = false;
            this.searchBox.model.on("force-change", function () {
              called = true;
            });
            this.searchBox.showSearchResults();
            called.should.equal(true);
          });
        });

        it("should format each result", function () {
          sinon.spy(this.searchBox, "formatResults");
          this.searchBox.handleSearchResults([this.searchEntry]);
          this.searchBox.formatResults.calledWith(this.searchEntry)
            .should.equal(true);
        });
        it("should hide the loading icon", function () {
          this.searchBox.$el.addClass("loading");
          this.searchBox.handleSearchResults([this.searchEntry]);
          this.searchBox.$el.hasClass("loading").should.equal(false);
        });
        it("should create drop down entries for each result", function () {
          sinon.spy(this.searchBox, "generateSearchEntry");
          this.searchBox.handleSearchResults([this.searchEntry]);
          this.searchBox.generateSearchEntry.calledOnce
            .should.equal(true);
        });
        it("should bind events", function () {
          sinon.spy(this.searchBox, "bindEventsToSearchEntries");
          this.searchBox.handleSearchResults([this.searchEntry]);
          this.searchBox.bindEventsToSearchEntries.calledOnce
            .should.equal(true);
        });
        it("should show the drop down", function () {
          sinon.spy(this.searchBox, "showSearchResults");
          this.searchBox.handleSearchResults([this.searchEntry]);
          this.searchBox.showSearchResults.calledOnce
            .should.equal(true);
        });
      });

      describe("hideSearchResults", function () {
        beforeEach(function () {
          this.searchBox.model = new Backbone.Model();
        });
        it("should toggle the drop down", function () {
          sinon.stub(this.searchBox, "toggleDropdown");
          this.searchBox.hideSearchResults();
          this.searchBox.toggleDropdown.calledOnce.should.equal(true);
        });
        it("should set a variable flagging it is closed", function () {
          this.searchBox.dropdownVisible = true;
          this.searchBox.hideSearchResults();
          this.searchBox.dropdownVisible.should.equal(false);
        });
        it("should remove the 'search-visible' class from the body", function () {
          $("body").addClass("search-visible");
          this.searchBox.hideSearchResults();
          $("body.search-visible").length.should.equal(0);
        });
        it("should unset the highlights", function () {
          this.searchBox.model.set("highlights", [123]);
          this.searchBox.model.get("highlights").length.should.equal(1);
          this.searchBox.hideSearchResults();
          this.searchBox.model.get("highlights").length.should.equal(0);
        });
        it("should unset the query", function () {
          this.searchBox.model.set("query", "some search");
          this.searchBox.model.get("query").length.should.not.equal(0);
          this.searchBox.hideSearchResults();
          this.searchBox.model.get("query").length.should.equal(0);
        });
        it("should persist the query string in the text box", function () {
          this.searchBox.render();
          this.searchBox.model.set("query", "some search");
          this.searchBox.hideSearchResults();
          this.searchBox.$("#search").val().should.equal("some search");
        });
        it("should not persist the query string in the text box if it is empty", function () {
          this.searchBox.render();
          this.searchBox.model.set("query", null);
          this.searchBox.hideSearchResults();
          this.searchBox.$("#search").val().should.equal("");
        });
        it("should force the model to be changed", function () {
          var called = false;
          this.searchBox.model.on("force-change", function () {
            called = true;
          });
          this.searchBox.hideSearchResults();
          called.should.equal(true);
        });

        describe("bsHideSearchResults", function () {
          it("should prevent propagation when the dropdown is visible", function () {
            this.searchBox.dropdownVisible = true;
            var called = false;
            this.searchBox.bsHideSearchResults({
              preventDefault: function () {
                called = true;
              }
            });
            called.should.equal(true);
          });
          it("should not prevent propagation when the dropdown is not visible", function () {
            this.searchBox.dropdownVisible = false;
            var called = false;
            this.searchBox.bsHideSearchResults({
              preventDefault: function () {
                called = true;
              }
            });
            called.should.equal(false);
          });
        });
      });

      describe("bsShowSearchResults", function () {
        it("should prevent propagation when the dropdown is not visible", function () {
          this.searchBox.dropdownVisible = false;
          var called = false;
          this.searchBox.bsShowSearchResults({
            preventDefault: function () {
              called = true;
            }
          });
          called.should.equal(true);
        });
        it("should not prevent propagation when the dropdown is visible", function () {
          this.searchBox.dropdownVisible = true;
          var called = false;
          this.searchBox.bsShowSearchResults({
            preventDefault: function () {
              called = true;
            }
          });
          called.should.equal(false);
        });
      });

      describe("resultSelected", function () {
        it("should set the model's end/start date a minimum of 10 years distant", function () {
          var date = this.searchBox.extractDate({
            start_date: new Date(2000, 0, 1),
            end_date: new Date(2002, 0, 1)
          });
          date[0].should.equal(1996);
          date[1].should.equal(2006);
        });
        it("should set the model's start and end date directly if they are more than 10 years apart", function () {
          var date = this.searchBox.extractDate({
            start_date: new Date(1900, 0, 1),
            end_date: new Date(2002, 0, 1)
          });
          date[0].should.equal(1900);
          date[1].should.equal(2002);
        });
        it("should set the center to be the location of the bounding box if the bounding box is a point", function () {
          var modelData = {};
          this.searchBox.extractPointData(modelData, {area: [{lat: 10, lon: -20}]});
          modelData.center.should.eql([10, -20]);
        });
        it("should set the zoom to be 12 if the bounding box is a point", function () {
          var modelData = {};
          this.searchBox.extractPointData(modelData, {area: [{lat: 10, lon: -20}]});
          modelData.zoom.should.equal(12);
        });
        it("should create a bounds that is 10% greater than the bounding box", function () {
          this.searchBox.extractBound([{}, {}], "lat", 10, 20).should.eql(
            [{lat: 9}, {lat: 21}]
          );
        });
        it("should set the zoom to be -1 if the bounding box is not a point", function () {
          var modelData = {};
          this.searchBox.extractBoundingBoxData(modelData, {area: [{lat: 10, lon: -20}, {lat: 11, lon: -21}]});
          modelData.zoom.should.equal(-1);
        });
        it("should set the highlights to the id of the clicked result", function () {
          sinon.stub(this.searchBox, "extractData", function () {
            return {
              area: [{lat: 10, lon: -20}],
              thing_id: 123
            };
          });
          sinon.stub(this.searchBox, "extractDate");
          sinon.stub(this.searchBox, "setModelData");
          this.searchBox.resultSelected();
          this.searchBox.setModelData.args[0][0].highlights[0].id
            .should.equal(123);
        });
        it("should set the highlights points from the points of the clicked result", function () {
          sinon.stub(this.searchBox, "extractData", function () {
            return {
              points: [{lat: 11, lon: -21}],
              area: [{lat: 10, lon: -20}],
              thing_id: 123
            };
          });
          sinon.stub(this.searchBox, "extractDate");
          sinon.stub(this.searchBox, "setModelData");
          this.searchBox.resultSelected();
          this.searchBox.setModelData.args[0][0].highlights[0].points
            .should.eql([{lat: 11, lon: -21}]);
        });
        it("should set the highlights points from the area of the clicked result if there are no points", function () {
          sinon.stub(this.searchBox, "extractData", function () {
            return {
              area: [{lat: 10, lon: -20}],
              thing_id: 123
            };
          });
          sinon.stub(this.searchBox, "extractDate");
          sinon.stub(this.searchBox, "setModelData");
          this.searchBox.resultSelected();
          this.searchBox.setModelData.args[0][0].highlights[0].points
            .should.eql([{lat: 10, lon: -20}]);
        });
        it("should remove all filters", function () {
          this.searchBox.model = new Backbone.Model({
            filterState: new Backbone.Collection()
          });
          FilterUrlSerialiser.deserialise("3:*", this.searchBox.model);
          FilterUrlSerialiser.serialise(this.searchBox.model).should.not.equal("");
          this.searchBox.setModelData();
          FilterUrlSerialiser.serialise(this.searchBox.model).should.equal("");
        });
        it("should trigger a change event", function () {
          this.searchBox.model = new Backbone.Model({
            filterState: new Backbone.Collection()
          });
          var called = false;
          var handler = function () {
            called = true;
          };
          this.searchBox.model.on("change", handler);
          this.searchBox.setModelData();
          called.should.equal(true);
        });
      });

    });
  }
);
