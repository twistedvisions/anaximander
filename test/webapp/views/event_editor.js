/*global describe, it, beforeEach, afterEach, sinon */
define(

  ["backbone", "views/event_editor", "analytics", "models/event"],

  function (Backbone, EventEditor, Analytics, Event) {

    describe("event editor", function () {
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

      describe("saving", function () {

        beforeEach(function () {
          sinon.stub(Analytics, "eventAdded");
          sinon.stub(Event.prototype, "save");

          this.editor = new EventEditor({
            model: new Backbone.Model({date: [1900, 2000]})
          });
          this.editor.getPlaceValue = function () {
            return {
              name: "some place"
            };
          };
          this.editor.render();
          this.editor.$("input[data-key=name]").val("some name");
          this.editor.$("input[data-key=link]").val("some link");
          this.editor.$("input[data-key=start]").val("2012-12-04");
          this.editor.$("input[data-key=end]").val("2012-12-05");
          this.editor.$("input[data-key=place]").val("some place name");

          this.editor.$("input[data-key=place]").select2("data", {id: 1, text: "some place"});
          this.editor.$("input[data-key=attendees]").select2("data", {id: 1, text: "some guy"});
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

        it("should update the highlight if the added attendee is already highlighted", function () {
          this.editor.model.set("highlight", {id: 123});
          this.editor.updateHighlight({attendees: [{id: 123}]});
          this.editor.model.get("highlight").reset.should.equal(true);
        });

        it("should not update the highlight if the added attendee is not highlighted", function () {
          this.editor.model.set("highlight", {id: 123});
          this.editor.updateHighlight({attendees: [{id: 1234}]});
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
      });
    });

  }
);
