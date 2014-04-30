/*global sinon, describe, it, beforeEach, afterEach */
define(

  ["underscore", "backbone", "models/thing", "views/thing_editor_modal",
    "collections/types", "analytics"],

  function (_, Backbone, Thing, ThingEditorModal, TypesCollection, analytics) {

    describe("thing editor", function () {
      beforeEach(function () {
        TypesCollection.instance = new TypesCollection([{
          id: 3,
          name: "first type"
        }]);
        this.thingEditor = new ThingEditorModal({
          model: new Thing({
            name: "some name",
            link: "some link",
            typeId: 3,
            subtypes: []
          }),
          state: new Backbone.Model()
        });
      });
      describe("interactions", function () {
        it("should show history when you click on the tab", function () {
          sinon.stub(this.thingEditor, "showHistoryTab");
          this.thingEditor.render();
          this.thingEditor.$(".nav .history a").trigger("click");
          this.thingEditor.showHistoryTab.calledOnce.should.equal(true);
        });
        it("should save when you click the save button", function () {
          sinon.stub(this.thingEditor, "handleSave");
          this.thingEditor.render();
          this.thingEditor.$(".save").trigger("click");
          this.thingEditor.handleSave.calledOnce.should.equal(true);
        });
      });
      describe("validation", function () {
        it("should only save if a change was made", function () {
          this.thingEditor.render();
          var shouldValidate = false;
          this.thingEditor.model.hasDifferences = function () {
            return shouldValidate;
          };
          sinon.stub(this.thingEditor.thingEditor, "validate", function () {
            return true;
          });
          this.thingEditor.$("textarea[data-key=reason]").val("some long reason");
          this.thingEditor.validate().should.equal(false);
          shouldValidate = true;
          this.thingEditor.validate().should.equal(true);
        });
        it("should only save if a reason was entered", function () {
          this.thingEditor.render();
          this.thingEditor.model.hasDifferences = function () {
            return true;
          };
          sinon.stub(this.thingEditor.thingEditor, "validate", function () {
            return true;
          });
          this.thingEditor.validate().should.equal(false);
          this.thingEditor.$("textarea[data-key=reason]").val("some long reason");
          this.thingEditor.validate().should.equal(true);
        });
        it("should only save if the thing is valid", function () {
          this.thingEditor.render();
          var shouldValidate = false;
          this.thingEditor.model.hasDifferences = function () {
            return true;
          };
          sinon.stub(this.thingEditor.thingEditor, "validate", function () {
            return shouldValidate;
          });
          this.thingEditor.$("textarea[data-key=reason]").val("some long reason");
          this.thingEditor.validate().should.equal(false);
          shouldValidate = true;
          this.thingEditor.validate().should.equal(true);
        });
      });
      it("should show a message if the save fails", function () {
        this.thingEditor.render();
        this.thingEditor.handleSaveFail({}, {responseText: "it failed"});
        this.thingEditor.$(".error-message").text().should.equal("it failed");
      });
      describe("analytics", function () {
        beforeEach(function () {
          sinon.stub(analytics, "thingSaveClicked");
          sinon.stub(analytics, "thingSaved");
        });
        afterEach(function () {
          analytics.thingSaveClicked.restore();
          analytics.thingSaved.restore();
        });
        it("should track when someone clicks save", function () {
          this.thingEditor.render();
          this.thingEditor.handleSave();
          analytics.thingSaveClicked.calledOnce.should.equal(true);
        });
        it("should track when someone saves successfully", function () {
          this.thingEditor.render();
          this.thingEditor.handleSaveComplete();
          analytics.thingSaved.calledOnce.should.equal(true);
        });
      });

    });
  }

);
