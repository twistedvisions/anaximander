/*global describe, it, sinon */
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

      it("should track when an event is added", function () {
        sinon.stub(Analytics, "eventAdded");
        sinon.stub(Event.prototype, "save");
        try {
          var editor = new EventEditor({});
          editor.render();
          editor.$("input[data-key=name]").val("some name");
          editor.$("input[data-key=link]").val("some link");
          editor.$("input[data-key=start]").val("2012-12-04");
          editor.$("input[data-key=end]").val("2012-12-05");
          editor.$("input[data-key=place]").val("some place");
          editor.handleSave();
          Analytics.eventAdded.calledOnce.should.equal(true);
        } finally {
          Analytics.eventAdded.restore();
          Event.prototype.save.restore();
        }
      });

    });

  }

);
