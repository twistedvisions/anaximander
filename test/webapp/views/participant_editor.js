/*global sinon, describe, it, beforeEach */
define(

  ["backbone", "views/participant_editor", "collections/roles"],

  function (Backbone, ParticipantEditor, RolesCollection) {

    describe("rendering", function () {
      beforeEach(function () {
        this.typesCollection = new RolesCollection([{
          id: 1,
          name: "type 1",
          default_importance_id: 1,
          importances: [{
            id: 1,
            name: "importance 1"
          }]
        }, {
          id: 2,
          name: "type 2",
          default_importance_id: 3,
          importances: [{
            id: 2,
            name: "importance 2"
          }, {
            id: 3,
            name: "importance 3"
          }]
        }]);
      });
      it("should show the thing's name if it exists", function () {
        this.model = new Backbone.Model({id: 10, name: "existing thing name"});
        this.participantEditor = new ParticipantEditor({
          model: this.model,
          roles: this.typesCollection
        });
        this.participantEditor.render();
        this.participantEditor.$(".name").text().should.equal("existing thing name");
      });
      it("should make the thing name's editable if it is a new thing", function () {
        this.model = new Backbone.Model({id: -1, name: "new thing name"});
        this.participantEditor = new ParticipantEditor({
          model: this.model,
          roles: this.typesCollection
        });
        this.participantEditor.render();
        this.participantEditor.$(".new-thing input[data-key=thing-name]").val().should.equal("new thing name");
      });
      it("should remove participants when the remove button is clicked", function () {
        this.model = new Backbone.Model({id: -1, name: "new thing name"});
        this.participantEditor = new ParticipantEditor({
          model: this.model,
          roles: this.typesCollection
        });
        this.participantEditor.render();
        sinon.stub(this.participantEditor.$el, "remove");
        this.participantEditor.removeParticipant();
        this.participantEditor.$el.remove.calledOnce.should.equal(true);
      });
    });

    describe("getValue", function () {
      it("should get the value of the thing editor if it is a new thing", function () {
        this.model = new Backbone.Model({id: -1, name: "new thing name"});
        this.participantEditor = new ParticipantEditor({
          model: this.model,
          roles: this.typesCollection
        });
        this.participantEditor.render();
        var value = this.participantEditor.getValue();
        value.thing.id.should.equal(-1);
        value.thing.name.should.equal("new thing name");
      });
      it("should get the id of the thing if it already exists", function () {
        this.model = new Backbone.Model({id: 10, name: "existing thing name"});
        this.participantEditor = new ParticipantEditor({
          model: this.model,
          roles: this.typesCollection
        });
        this.participantEditor.render();
        this.participantEditor.getValue().thing.id.should.equal(10);
      });
      it("should get the value of the type selector", function () {
        this.model = new Backbone.Model({id: 10, name: "existing thing name"});
        this.participantEditor = new ParticipantEditor({
          model: this.model,
          roles: this.typesCollection
        });
        this.participantEditor.render();
        sinon.stub(this.participantEditor.typeSelector, "getValue", function () {
          return {type: "type value"};
        });
        this.participantEditor.getValue().type.should.equal("type value");
      });
    });
  }
);
