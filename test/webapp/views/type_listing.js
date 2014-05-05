/*global sinon, describe, it, before, after, beforeEach, afterEach*/
define(

  ["jquery", "backbone", "when", "views/type_listing"],

  function ($, Backbone, when, TypeListing) {

    describe.only("type listing", function () {
      describe("startup", function () {
        before(function () {
          this.typeListing = new TypeListing();
          sinon.stub(this.typeListing, "getData");
          sinon.stub(this.typeListing, "getThingTypes", function () {
            return {
              then: function (f) {
                f([
                  {id: 1, name: "t1"},
                  {id: 2, name: "t2"}
                ]);
              }
            };
          });
          $("body").append(this.typeListing.render());
        });
        after(function () {
          this.typeListing.getThingTypes.restore();
          this.typeListing.getData.restore();
          this.typeListing.$el.remove();
        });
        it("should show event types by default", function () {
          this.typeListing.$("#event-tab").hasClass("active").should.equal(true);
        });
        it("should show types by default", function () {
          this.typeListing.$("div.types:visible").length.should.equal(1);
        });
        it("should not show importances by default", function () {
          this.typeListing.$("div.importances:visible").length.should.equal(0);
        });
        it("should populate the thing type dropdown", function () {
          this.typeListing.$(".thing-tab li").length.should.equal(2);
        });

      });
      describe("interactions", function () {

        beforeEach(function () {
          this.typeListing = new TypeListing();
          sinon.stub(this.typeListing, "getData");
          $("body").append(this.typeListing.render());
        });
        afterEach(function () {
          this.typeListing.$el.remove();
          this.typeListing.getData.restore();
        });
        describe("showTypes", function () {
          it("should show the types table", function () {
            this.typeListing.$("div.types").hide();
            this.typeListing.showTypes([[], []]);
            this.typeListing.$("div.types:visible").length.should.equal(1);
          });
          it("should hide the importances table", function () {
            this.typeListing.$("div.importances").show();
            this.typeListing.showTypes([[], []]);
            this.typeListing.$("div.importances:visible").length.should.equal(0);
          });
          it("should empty the types table before populating it", function () {
            this.typeListing.$("div.types tbody").append($("<tr>"));
            this.typeListing.$("div.types tbody tr").length.should.equal(1);
            this.typeListing.showTypes([[], []]);
            this.typeListing.$("div.types tbody tr").length.should.equal(0);
          });
          it("should combine the type with the usage", function () {
            this.typeListing.showTypes([[{id: 1, importances: []}], [{id: 1, usage: 10}]]);
            this.typeListing.$("div.types tbody tr td.usage").text().should.equal("10");
          });
          it("should list the types", function () {
            this.typeListing.showTypes(
              [
                [
                  {id: 1, importances: []},
                  {id: 2, importances: []}
                ],
                [
                  {id: 1, usage: 10},
                  {id: 2, usage: 10}
                ]
              ]
            );
            this.typeListing.$("div.types tbody tr").length.should.equal(2);
          });
          it("should make names editable", function () {
            this.typeListing.showTypes([[{id: 1, name: "importance name", importances: []}], []]);
            this.typeListing.$("div.types tbody tr td.name").trigger("click");
            this.typeListing.$("div.types tbody tr td.name.editing").length.should.equal(1);
          });
          it("should show the default importances for a type", function () {
            this.typeListing.showTypes(
              [
                [
                  {
                    id: 1,
                    name: "importance name",
                    default_importance_id: 2,
                    importances: [
                      {id: 1, name: "importance 1"},
                      {id: 2, name: "importance 2"},
                      {id: 3, name: "importance 3"}
                    ]
                  }
                ],
                []
              ]
            );
            this.typeListing.$("div.types tbody tr td.default-importance select option[selected]").text().trim().should.equal("importance 2");
          });
          it("should show the importances for the type", function () {
            sinon.stub(this.typeListing, "getImportanceData", function () {
              return {
                then: function (fn) {
                  fn();
                }
              };
            });
            sinon.stub(this.typeListing, "showImportances");
            this.typeListing.showTypes([[{id: 1, importances: []}], [{id: 1, usage: 10}]]);
            this.typeListing.$(".view-importances span").trigger("click");
            this.typeListing.showImportances.calledOnce.should.equal(true);
            this.typeListing.showImportances.restore();
            this.typeListing.getImportanceData.restore();
          });
        });

        describe("showImportances", function () {
          beforeEach(function () {
            sinon.stub(this.typeListing, "getImportanceData", function () {
              return {
                then: function (fn) {
                  return fn([{id: 1, usage: 5}]);
                }
              };
            });
            this.typeListing.$("div.importances tbody").append($("<tr>"));
            this.typeListing.showTypes(
              [
                [
                  {
                    id: 1,
                    name: "type name",
                    importances: [
                      {id: 1, name: "importance 1"},
                      {id: 2, name: "importance 2"}
                    ]
                  }
                ],
                [
                  {id: 1, usage: 10}
                ]
              ]
            );
            this.typeListing.$(".view-importances span").trigger("click");
          });
          it("should show the importances table", function () {
            this.typeListing.$("div.importances:visible").length.should.equal(1);
          });
          it("should hide the types table", function () {
            this.typeListing.$("div.types:visible").length.should.equal(0);
          });
          it("should empty the importances table before populating it", function () {
            this.typeListing.$("div.importances tbody tr").length.should.not.equal(3);
          });
          it("should show the selected type", function () {
            this.typeListing.$("div.importances .selected-type").text().should.equal("type name");
          });
          it("should list the importances", function () {
            this.typeListing.$("div.importances tbody tr").length.should.equal(2);
          });
          it("should show usages", function () {
            this.typeListing.$("div.importances tbody tr:nth-child(1) td.usage").text().should.equal("5");
          });
          it("should make names editable", function () {
            var el = this.typeListing.$("div.importances tbody tr:nth-child(1) td.name");
            el.trigger("click");
            el.hasClass("editing").should.equal(true);
          });
          it("should make descriptions editable", function () {
            var el = this.typeListing.$("div.importances tbody tr:nth-child(1) td.description");
            el.trigger("click");
            el.hasClass("editing").should.equal(true);
          });
          it("should make values editable", function () {
            var el = this.typeListing.$("div.importances tbody tr:nth-child(1) td.value");
            el.trigger("click");
            el.hasClass("editing").should.equal(true);
          });
          describe("closing", function () {
            beforeEach(function () {
              this.typeListing.$("div.importances .close").trigger("click");
            });
            it("should hide on close", function () {
              this.typeListing.$("div.importances:visible").length.should.equal(0);
            });
            it("should show types on close", function () {
              this.typeListing.$("div.types:visible").length.should.equal(1);
            });
          });
        });
        describe("editing default importance", function () {
          beforeEach(function () {
            this.typeListing.showTypes(
              [
                [
                  {
                    id: 1,
                    name: "type name",
                    default_importance_id: 1,
                    importances: [
                      {id: 1, name: "importance 1"},
                      {id: 2, name: "importance 2"}
                    ]
                  }
                ],
                [
                  {id: 1, usage: 10}
                ]
              ]
            );
            sinon.stub(this.typeListing, "saveTypeChange", function () {
              return {
                then: function (f) {
                  f();
                }
              };
            });
          });
          it("should save the importance if it is different", function () {
            this.typeListing.$(".default-importance select").val().should.equal("1");
            this.typeListing.$(".default-importance select").val(2);
            this.typeListing.$(".default-importance select").val().should.equal("2");
            this.typeListing.$(".default-importance select").trigger("change");
            this.typeListing.saveTypeChange.calledOnce.should.equal(true);
            this.typeListing.saveTypeChange.args[0][0].defaultImportanceId.should.equal(2);
          });
          it("should not save the importance if it is the same", function () {
            this.typeListing.$(".default-importance select").val().should.equal("1");
            this.typeListing.$(".default-importance select").val(1);
            this.typeListing.$(".default-importance select").val().should.equal("1");
            this.typeListing.$(".default-importance select").trigger("change");
            this.typeListing.saveTypeChange.callCount.should.equal(0);
          });
        });
        describe("editing cells", function () {
          beforeEach(function () {
            sinon.stub(this.typeListing, "saveTypeChange", function () {
              return {
                then: function (fn) {
                  fn();
                }
              };
            });
            this.typeListing.showTypes(
              [
                [
                  {
                    id: 1,
                    name: "type name",
                    last_edited: "2014-04-28",
                    importances: []
                  }
                ],
                []
              ]
            );
            this.el = this.typeListing.$("div.types tbody td.name");
            this.el.trigger("click");
          });
          it("should take the current cell value and put it in a input field", function () {
            this.el.find("input").length.should.equal(1);
            this.el.find("input").val().should.equal("type name");
          });
          it("should hide the current cell value", function () {
            this.el.text().should.equal("");
          });
          it("should add the editing class", function () {
            this.el.hasClass("editing").should.equal(true);
          });
          it("should select the text of the input field when commencing editing", function () {
            this.el.find("input")[0].selectionStart.should.equal(0);
            this.el.find("input")[0].selectionEnd.should.equal("type name".length);
          });
          describe("cancelling edit", function () {
            beforeEach(function () {
              $(this.el.find("input")).trigger("blur");
            });
            it("should remove the editing class when editing finishes", function () {
              this.el.hasClass("editing").should.equal(false);
            });
            it("should finish editing without saving when focus is lost", function () {
              this.typeListing.saveTypeChange.callCount.should.equal(0);
            });
          });
          describe("saving", function () {
            beforeEach(function () {
              this.el.find("input").val("new name");
              var event = $.Event("keydown");
              event.keyCode = 13;
              this.el.find("input").trigger(event);
            });
            afterEach(function () {
              this.typeListing.saveTypeChange.restore();
            });
            it("should save when enter is pressed", function () {
              this.el.text().should.equal("new name");
            });
            it("should pass the id as a save parameter", function () {
              this.typeListing.saveTypeChange.args[0][0].id.should.equal(1);
            });
            it("should pass the last_edited date as a save parameter", function () {
              this.typeListing.saveTypeChange.args[0][0].last_edited.should.equal("2014-04-28");
            });
            it("should pass the changed key with the value as a save parameter", function () {
              this.typeListing.saveTypeChange.args[0][0].name.should.equal("new name");
            });
          });
          describe("no changes when saving", function () {
            beforeEach(function () {
              this.el.find("input").val("type name");
              var event = $.Event("keydown");
              event.keyCode = 13;
              this.el.find("input").trigger(event);
            });
            afterEach(function () {
              this.typeListing.saveTypeChange.restore();
            });
            it("should not call save if nothing actually changed", function () {
              this.typeListing.saveTypeChange.callCount.should.equal(0);
            });
          });
        });
      });
    });

  }

);
