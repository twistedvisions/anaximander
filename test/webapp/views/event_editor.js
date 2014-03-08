/*global describe, it, beforeEach, afterEach, sinon */
define(

  ["underscore", "backbone", "views/event_editor", "collections/roles", "collections/event_types", "analytics", "models/event"],

  function (_, Backbone, EventEditor, Roles, EventTypes, Analytics, Event) {

    describe("event editor", function () {
      beforeEach(function () {
        Roles.instance = new Roles();
        Roles.instance.reset([{id: 1, "name": "role 1"}]);
        EventTypes.instance = new EventTypes();
        EventTypes.instance.reset([{id: 1, "name": "event type 1"}]);
      });
      afterEach(function () {
        delete Roles.instance;
        delete EventTypes.instance;
      });
      describe("getDatePickerOpts", function () {
        it("should set the year range", function () {
          var editor = new EventEditor({
            model: new Backbone.Model({date: [1900, 2000]})
          });
          editor.getDatePickerOpts().yearRange.should.equal("1880:2020");
        });
        it("should set the default date for the start", function () {
          var editor = new EventEditor({
            model: new Backbone.Model({date: [1900, 2000]})
          });
          editor.getDatePickerOpts(true).defaultDate.should.eql(new Date(1900, 0, 1));
        });
      });
      describe("interactions", function () {
        it("should set the end when the start is set if it is empty", function () {
          var editor = new EventEditor({
            model: new Backbone.Model({date: [1900, 2000]})
          });
          editor.render();
          editor.$("input[data-key=end]").val().should.equal("");
          editor.$("input[data-key=start]").val("2012-12-04");
          editor.$("input[data-key=start]").trigger("change");
          editor.$("input[data-key=end]").val().should.equal("2012-12-04");
          editor.$("input.date").datepicker("hide");
          editor.$el.remove();
        });

        it("should not set the end when the start is set if it is already set", function () {
          var editor = new EventEditor({
            model: new Backbone.Model({date: [1900, 2000]})
          });
          editor.render();
          editor.$("input[data-key=end]").val("2012-12-05");
          editor.$("input[data-key=start]").val("2012-12-04");
          editor.$("input[data-key=start]").trigger("change");
          editor.$("input[data-key=end]").val().should.equal("2012-12-05");
          editor.$("input.date").datepicker("hide");
          editor.$el.remove();
        });
        it("should add a participant when the participant select box changes", function () {
          var editor = new EventEditor({
            model: new Backbone.Model({date: [1900, 2000]})
          });
          sinon.stub(editor, "addParticipant");
          editor.render();
          editor.$("input[data-key=participants]").trigger("change");
          editor.addParticipant.calledOnce.should.equal(true);
        });
      });

      describe("addParticipant", function () {
        it("should add a model to the participants collection", function () {
          var editor = new EventEditor({
            model: new Backbone.Model({date: [1900, 2000]})
          });
          editor.render();
          sinon.stub(editor, "getSelectedParticipant", function () {
            return {};
          });
          _.keys(editor.participants).length.should.equal(0);
          editor.addParticipant();
          _.keys(editor.participants).length.should.equal(1);
        });
        it("should a view to the participants list", function () {
          var editor = new EventEditor({
            model: new Backbone.Model({date: [1900, 2000]})
          });
          editor.render();
          sinon.stub(editor, "getSelectedParticipant", function () {
            return {};
          });
          editor.$(".participant-list .participant-editor").length.should.equal(0);
          editor.addParticipant();
          editor.$(".participant-list .participant-editor").length.should.equal(1);
        });
        it("should empty the select box", function () {
          var editor = new EventEditor({
            model: new Backbone.Model({date: [1900, 2000]})
          });
          editor.render();
          sinon.stub(editor, "getSelectedParticipant", function () {
            return {};
          });
          sinon.stub(editor, "clearParticipantSelector");
          editor.addParticipant();
          editor.clearParticipantSelector.calledOnce.should.equal(true);
        });
        describe("participantEditor", function () {
          beforeEach(function () {
            this.editor = new EventEditor({
              model: new Backbone.Model({date: [1900, 2000]})
            });
            this.editor.render();
            sinon.stub(this.editor, "getSelectedParticipant", function () {
              return {};
            });
            this.editor.addParticipant();
          });
          it("should remove participants on the participant editor's remove event", function () {
            _.keys(this.editor.participants).length.should.equal(1);
            this.editor.participants[_.keys(this.editor.participants)[0]].trigger("remove");
            _.keys(this.editor.participants).length.should.equal(0);
          });
        });
      });

      describe("saving", function () {

        beforeEach(function () {
          sinon.stub(Analytics, "eventAdded");
          sinon.stub(Event.prototype, "save");

          this.editor = new EventEditor({
            model: new Backbone.Model({date: [1900, 2000]})
          });
          this.editor.getSelectValue = function (type) {
            return {
              name: "some " + type
            };
          };
          this.editor.render();
          this.editor.$("input[data-key=name]").val("some name");
          this.editor.$("input[data-key=link]").val("some link");
          this.editor.$("input[data-key=start]").val("2012-12-04");
          this.editor.$("input[data-key=end]").val("2012-12-05");
          this.editor.$("input[data-key=place]").val("some place name");
          this.editor.$("input[data-key=place]").select2("data", {id: 1, text: "some place"});
          this.editor.$("input[data-key=type]").val("some type name");
          this.editor.$("input[data-key=type]").select2("data", {id: 1, text: "some type"});
          this.editor.$("input[data-key=importance]").val("some importance name");
          this.editor.$("input[data-key=importance]").select2("data", {id: 1, text: "some importance"});
        });

        afterEach(function () {
          Analytics.eventAdded.restore();
          Event.prototype.save.restore();
        });

        it("should track when an event is added", function () {
          this.editor.handleSave();
          Analytics.eventAdded.calledOnce.should.equal(true);
        });

        it("should trigger a change on the model to say it needs updating", function () {
          sinon.stub(this.editor.model, "trigger");
          sinon.stub(this.editor, "updateHighlight");
          try {
            this.editor.handleSaveComplete();
            this.editor.model.trigger.calledWith("change:center").should.equal(true);
          } finally {
            this.editor.model.trigger.restore();
          }
        });

        it("should not save if no type is added", function () {
          this.editor.$("input[data-key=type]").val("");
          this.editor.handleSave();
          this.editor.eventsCollection.toJSON().length.should.equal(0);
        });
        it("should not save if no place is added", function () {
          this.editor.$("input[data-key=place]").val("");
          this.editor.handleSave();
          this.editor.eventsCollection.toJSON().length.should.equal(0);
        });

        it("should update the highlight if the added participant is already highlighted", function () {
          this.editor.model.set("highlight", {id: 123});
          this.editor.updateHighlight({participants: [{thing: {id: 123}}]});
          this.editor.model.get("highlight").reset.should.equal(true);
        });

        it("should not update the highlight if the added participant is not highlighted", function () {
          this.editor.model.set("highlight", {id: 123});
          this.editor.updateHighlight({participants: [{thing: {id: 1234}}]});
          (this.editor.model.get("highlight").reset === undefined).should.equal(true);
        });

        it("should show the error message if it fails", function () {
          this.editor.handleSaveFail({}, {responseText: "some error message"});
          this.editor.$(".error-message").css("display").should.not.equal("none");
          this.editor.$(".error-message").text().should.equal("some error message");
        });

        it("should hide the error message when saving again", function () {
          this.editor.$(".error-message").show();
          this.editor.handleSave();
          this.editor.$(".error-message").css("display").should.equal("none");
        });

        it("should prepend // if the url doesn't start with http or https", function () {
          this.editor.handleSave();
          this.editor.eventsCollection.toJSON()[0].link
            .should.equal("//some link");
        });

        it("should not prepend // if the url starts with http", function () {
          this.editor.$("input[data-key=link]").val("http://something.com");
          this.editor.handleSave();
          this.editor.eventsCollection.toJSON()[0].link
            .should.equal("http://something.com");
        });

        it("should not prepend // if the url starts with http", function () {
          this.editor.$("input[data-key=link]").val("https://something.com");
          this.editor.handleSave();
          this.editor.eventsCollection.toJSON()[0].link
            .should.equal("https://something.com");
        });

        it("should not prepend // if the url starts with //", function () {
          this.editor.$("input[data-key=link]").val("//something.com");
          this.editor.handleSave();
          this.editor.eventsCollection.toJSON()[0].link
            .should.equal("//something.com");
        });

        // it("should not save if no participants are added", function () {
        //   //can't get parsley to work inside a test for custom validators
        //   this.editor.participants.length.should.equal(0);
        //   this.editor.eventsCollection.toJSON().length.should.equal(0);
        //   this.editor.handleSave();
        //   this.editor.eventsCollection.toJSON().length.should.equal(0);
        // });
      });
    });

  }
);
