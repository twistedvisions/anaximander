/*global describe, it, beforeEach, afterEach, sinon */
define(

  ["backbone", "views/event_editor", "analytics", "models/event"], 

  function (Backbone, EventEditor, Analytics, Event) {

    describe("interaction", function () {

      it("should set the end when the start is set if it is empty", function () {
        var editor = new EventEditor({});
        editor.render();
        editor.$("input[data-key=end]").val().should.equal("");
        editor.$("input[data-key=start]").val("2012-12-04");
        editor.$("input[data-key=start]").trigger("change");
        editor.$("input[data-key=end]").val().should.equal("2012-12-04");
        editor.$("input.date").datepicker("hide");
        editor.$el.remove();
      });

      it("should not set the end when the start is set if it is already set", function () {
        var editor = new EventEditor({});
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
            model: new Backbone.Model()
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
          try {

            this.editor.handleSaveComplete();
            this.editor.model.trigger.calledWith("change").should.equal(true);
          } finally {
            this.editor.model.trigger.restore();
          }
        });

      });
    });

  }
);
