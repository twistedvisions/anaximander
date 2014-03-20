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
            state: new Backbone.Model({date: [1900, 2000]})
          });
          editor.getDatePickerOpts().yearRange.should.equal("1880:2020");
        });
        it("should set the default date for the start", function () {
          var editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]})
          });
          editor.getDatePickerOpts(true).defaultDate.should.eql(new Date(1950, 0, 1));
        });
      });
      describe("interactions", function () {
        beforeEach(function () {
          this.editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]})
          });
        });
        it("should set the end when the start is set if it is empty", function () {

          this.editor.render();
          this.editor.$("input[data-key=end]").val().should.equal("");
          this.editor.$("input[data-key=start]").val("2012-12-04");
          this.editor.$("input[data-key=start]").trigger("change");
          this.editor.$("input[data-key=end]").val().should.equal("2012-12-04");
          this.editor.$("input.date").datepicker("hide");
          this.editor.$el.remove();
        });

        it("should not set the end when the start is set if it is already set", function () {
          this.editor.render();
          this.editor.$("input[data-key=end]").val("2012-12-05");
          this.editor.$("input[data-key=start]").val("2012-12-04");
          this.editor.$("input[data-key=start]").trigger("change");
          this.editor.$("input[data-key=end]").val().should.equal("2012-12-05");
          this.editor.$("input.date").datepicker("hide");
          this.editor.$el.remove();
        });
        it("should add a participant when the participant select box changes", function () {
          sinon.stub(this.editor, "addParticipant");
          this.editor.render();
          this.editor.$("input[data-key=participants]").trigger("change");
          this.editor.addParticipant.calledOnce.should.equal(true);
        });
      });

      describe("addParticipant", function () {
        beforeEach(function () {
          this.editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]})
          });
          this.editor.render();
          sinon.stub(this.editor, "getSelectedParticipant", function () {
            return {};
          });
        });
        it("should add a model to the participants collection", function () {
          _.keys(this.editor.participants).length.should.equal(0);
          this.editor.addParticipant();
          _.keys(this.editor.participants).length.should.equal(1);
        });
        it("should a view to the participants list", function () {
          this.editor.$(".participant-list .participant-editor").length.should.equal(0);
          this.editor.addParticipant();
          this.editor.$(".participant-list .participant-editor").length.should.equal(1);
        });
        it("should empty the select box", function () {
          sinon.stub(this.editor, "clearParticipantSelector");
          this.editor.addParticipant();
          this.editor.clearParticipantSelector.calledOnce.should.equal(true);
        });
        describe("participantEditor", function () {
          it("should remove participants on the participant editor's remove event", function () {
            this.editor.addParticipant();
            _.keys(this.editor.participants).length.should.equal(1);
            this.editor.participants[_.keys(this.editor.participants)[0]].trigger("remove");
            _.keys(this.editor.participants).length.should.equal(0);
          });
        });
      });

      describe("analytics", function () {
        it("should log when someone adds a participant", function () {
          sinon.stub(Analytics, "participantAdded");
          var editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]})
          });
          editor.render();
          sinon.stub(editor, "getSelectedParticipant", function () {
            return {id: 1, name: "some name"};
          });
          try {
            editor.addParticipant();
            Analytics.participantAdded.calledOnce.should.equal(true);
          } finally {
            editor.getSelectedParticipant.restore();
            Analytics.participantAdded.restore();
          }
        });
        it("should log when someone removes a participant", function () {
          sinon.stub(Analytics, "participantRemoved");
          var editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]})
          });
          editor.render();
          sinon.stub(editor, "getSelectedParticipant", function () {
            return {id: 1, name: "some name"};
          });
          try {
            editor.addParticipant();
            _.values(editor.participants)[0].trigger("remove");
            Analytics.participantRemoved.calledOnce.should.equal(true);
          } finally {
            editor.getSelectedParticipant.restore();
            Analytics.participantRemoved.restore();
          }
        });
      });

      describe("editing", function () {
        beforeEach(function () {
          this.editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]}),
            model: new Backbone.Model()
          });
          sinon.stub(this.editor, "populateView");
          this.editor.render();
          sinon.stub(this.editor.eventTypeSelector, "setValue");
          this.editor._populateView({
            name: "existing event name",
            place_name: "existing place name",
            link: "www.link.com",
            type_id: 1,
            importance_id: 1,
            start_date: new Date(1900, 11, 13).getTime(),
            end_date: new Date(2000, 0, 1).getTime(),
            participants: [
              {
                name: "John Smith",
                type: {id: 2},
                importance: {id: 2}
              }
            ]
          });
        });
        afterEach(function () {
          this.editor.populateView.restore();
        });
        it("should display the event name", function () {
          this.editor.$("input[data-key=name]").val().should.equal("existing event name");
        });
        it("should display the event place", function () {
          this.editor.$("input[data-key=place]").val().should.equal("existing place name");
        });
        it("should set the event type editor", function () {
          this.editor.eventTypeSelector.setValue.calledOnce.should.equal(true);
        });
        it("should set the event link", function () {
          this.editor.$("input[data-key=link]").val().should.equal("www.link.com");
        });
        it("should set the event start date", function () {
          this.editor.$("input[data-key=start]").val().should.equal("1900-12-13");
        });
        it("should set the event end date", function () {
          this.editor.$("input[data-key=end]").val().should.equal("2000-01-01");
        });
        it("should show each event participant", function () {
          this.editor.$(".participant-editor").length.should.equal(1);
        });
      });

      describe("saving", function () {

        beforeEach(function () {
          sinon.stub(Analytics, "eventAdded");
          sinon.stub(Event.prototype, "save");

          this.editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]})
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
          this.editor.$("input[data-key=type]").select2("data", {id: 1, text: "some type"});
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

        it("should save the place with a lat and lon if it is a new place", function () {
          this.editor.newEvent = {
            location: {
              lat: 3,
              lon: 4
            }
          };
          sinon.stub(this.editor, "getSelectValue", function () {
            return {
              id: -1,
              name: "new place"
            };
          });
          this.editor.getPlace().should.eql({
            id: -1,
            name: "new place",
            lat: 3,
            lon: 4
          });
        });

        it("should trigger a change on the model to say it needs updating", function () {
          sinon.stub(this.editor.state, "trigger");
          sinon.stub(this.editor, "updateHighlight");
          try {
            this.editor.handleSaveComplete();
            this.editor.state.trigger.calledWith("change:center").should.equal(true);
          } finally {
            this.editor.state.trigger.restore();
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
          this.editor.state.set("highlight", {id: 123});
          this.editor.updateHighlight({participants: [{thing: {id: 123}}]});
          this.editor.state.get("highlight").reset.should.equal(true);
        });

        it("should not update the highlight if the added participant is not highlighted", function () {
          this.editor.state.set("highlight", {id: 123});
          this.editor.updateHighlight({participants: [{thing: {id: 1234}}]});
          (this.editor.state.get("highlight").reset === undefined).should.equal(true);
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
