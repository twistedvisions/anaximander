/*global sinon, describe, it, before, after, beforeEach, afterEach*/
define(

  ["jquery", "underscore", "backbone", "when", "views/type_listing", "analytics"],

  function ($, _, Backbone, when, TypeListing, analytics) {

    describe("type listing", function () {
      describe("startup", function () {
        before(function () {
          this.typeListing = new TypeListing();
          sinon.stub(this.typeListing, "getData", function () {
            //dont ever return or it will try to render
            return when.defer().promise;
          });
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
          sinon.stub(analytics, "typeListing_showTypes");
          $("body").append(this.typeListing.render());
        });
        after(function () {
          analytics.typeListing_showTypes.restore();
          this.typeListing.getThingTypes.restore();
          this.typeListing.getData.restore();
          this.typeListing.$el.remove();
        });
        it("should show event types by default", function () {
          this.typeListing.$("#event-tab").hasClass("active").should.equal(true);
        });
        it("should send analytics by default", function () {
          analytics.typeListing_showTypes.calledOnce.should.equal(true);
          analytics.typeListing_showTypes.args[0][0].typeId.should.equal(2);
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
          sinon.stub(this.typeListing, "getData", function () {
            //dont ever return or it will try to render
            return when.defer().promise;
          });
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
            sinon.stub(analytics, "typeListing_showImportances");
            sinon.stub(analytics, "typeListing_hideImportances");
            sinon.stub(analytics, "typeListing_importanceEdited");
            this.typeListing.$(".view-importances span").trigger("click");
          });
          afterEach(function () {
            analytics.typeListing_showImportances.restore();
            analytics.typeListing_hideImportances.restore();
            analytics.typeListing_importanceEdited.restore();
          });
          it("should show the importances table", function () {
            this.typeListing.$("div.importances:visible").length.should.equal(1);
          });
          it("should send analytics", function () {
            analytics.typeListing_showImportances.calledOnce.should.equal(true);
            analytics.typeListing_showImportances.args[0][0].typeId.should.equal(1);
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
          it("should send analytics when the name is edited", function () {
            var el = this.typeListing.$("div.importances tbody tr:nth-child(1) td.name");
            el.trigger("click");
            analytics.typeListing_importanceEdited.calledOnce.should.equal(true);
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
            it("should send analytics", function () {
              analytics.typeListing_hideImportances.calledOnce.should.equal(true);
              analytics.typeListing_hideImportances.args[0][0].typeId.should.equal(1);
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
            this.callSuccessful = true;
            sinon.stub(this.typeListing, "saveTypeChange", _.bind(function () {
              return {
                then: _.bind(function (fn, reject) {
                  var type = {
                    id: 1,
                    name: "type name",
                    defaultImportanceId: 2,
                    last_edited: "2014-04-29",
                    importances: []
                  };
                  if (this.callSuccessful) {
                    fn(this.typeListing.handleTypeChange(type));
                  } else {
                    reject();
                  }
                }, this)
              };
            }, this));
            sinon.stub(analytics, "typeListing_typeSaved");
          });
          afterEach(function () {
            analytics.typeListing_typeSaved.restore();
          });
          it("should save the importance if it is different", function () {
            var select = this.typeListing.$(".default-importance select");
            select.val().should.equal("1");
            select.val(2);
            select.val().should.equal("2");
            select.trigger("change");
            this.typeListing.saveTypeChange.calledOnce.should.equal(true);
            this.typeListing.saveTypeChange.args[0][0].defaultImportanceId.should.equal(2);
          });
          it("should not save the importance if it is the same", function () {
            var select = this.typeListing.$(".default-importance select");
            select.val().should.equal("1");
            select.val(1);
            select.val().should.equal("1");
            select.trigger("change");
            this.typeListing.saveTypeChange.callCount.should.equal(0);
          });
          it("should update the last_edited time", function () {
            var cell = this.typeListing.$(".types tbody tr:nth-child(1) td.default-importance");
            cell.find("select").val(2);
            cell.find("select").trigger("change");
            var row = this.typeListing.$(".types tbody tr:nth-child(1)");
            row.data().lastEdited.should.equal("2014-04-29");
          });
          it("should send analytics", function () {
            var cell = this.typeListing.$(".types tbody tr:nth-child(1) td.default-importance");
            cell.find("select").val(2);
            cell.find("select").trigger("change");
            analytics.typeListing_typeSaved.calledOnce.should.equal(true);
          });
          it("should show an error message if it fails", function () {
            this.callSuccessful = false;
            var cell = this.typeListing.$(".types tbody tr:nth-child(1) td.default-importance");
            cell.find("select").val(2);
            cell.find("select").trigger("change");
            this.typeListing.$(".not-logged-in:visible").length.should.equal(1);
          });
        });
        describe("editing cells", function () {
          beforeEach(function () {
            this.callSuccessful = true;
            sinon.stub(this.typeListing, "saveTypeChange", _.bind(function () {
              return {
                then: _.bind(function (fn, reject) {
                  var type = {
                    id: 1,
                    name: "new name",
                    last_edited: "2014-04-29",
                    importances: []
                  };
                  if (this.callSuccessful) {
                    fn(this.typeListing.handleTypeChange(type));
                  } else {
                    reject();
                  }
                }, this)
              };
            }, this));
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
            this.el = this.typeListing.$("div.types tbody tr:nth-child(1) td.name");
            sinon.stub(analytics, "typeListing_typeEdited");
            sinon.stub(analytics, "typeListing_typeSaved");
            this.el.trigger("click");
          });
          afterEach(function () {
            this.typeListing.saveTypeChange.restore();
            analytics.typeListing_typeEdited.restore();
            analytics.typeListing_typeSaved.restore();
          });
          it("should take the current cell value and put it in a input field", function () {
            this.el.find("input").length.should.equal(1);
            this.el.find("input").val().should.equal("type name");
          });
          it("should send an analytics event", function () {
            analytics.typeListing_typeEdited.calledOnce.should.equal(true);
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
            it("should enter the new text when enter is pressed", function () {
              this.typeListing.$(".types tbody tr:nth-child(1) td.name").text().should.equal("new name");
            });
            it("should send analytics", function () {
              analytics.typeListing_typeSaved.calledOnce.should.equal(true);
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
            it("should update the last edited time of the row after the save", function () {
              this.typeListing.$(".types tbody tr:nth-child(1)").data().lastEdited.should.equal("2014-04-29");
            });
            it("should still be able to edit cells after the save", function () {
              var cell = this.typeListing.$(".types tbody tr:nth-child(1) td.name");
              cell.trigger("click");
              cell.hasClass("editing").should.equal(true);
            });
            it("should not allow you to save the new value a second time", function () {
              var cell = this.typeListing.$(".types tbody tr:nth-child(1) td.name");
              cell.trigger("click");
              cell.find("input").val("new name");
              var event = $.Event("keydown");
              event.keyCode = 13;
              cell.find("input").trigger(event);
              this.typeListing.saveTypeChange.callCount.should.equal(1);
            });
            it("should allow you to revert back to the original value", function () {
              var cell = this.typeListing.$(".types tbody tr:nth-child(1) td.name");
              cell.trigger("click");
              cell.find("input").val("type name");
              var event = $.Event("keydown");
              event.keyCode = 13;
              cell.find("input").trigger(event);
              this.typeListing.saveTypeChange.callCount.should.equal(2);
            });
            it("should show an error message if it fails", function () {
              this.callSuccessful = false;
              var cell = this.typeListing.$(".types tbody tr:nth-child(1) td.name");
              cell.trigger("click");
              cell.find("input").val("type name");
              var event = $.Event("keydown");
              event.keyCode = 13;
              cell.find("input").trigger(event);
              this.typeListing.$(".not-logged-in:visible").length.should.equal(1);
            });
          });
          describe("no changes when saving", function () {
            beforeEach(function () {
              this.el.find("input").val("type name");
              var event = $.Event("keydown");
              event.keyCode = 13;
              this.el.find("input").trigger(event);
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
