/*global sinon, describe, it, beforeEach, afterEach */
define(

  ["chai", "backbone", "views/participant_editor", "collections/roles", "collections/types"],

  function (chai, Backbone, ParticipantEditor, RolesCollection, TypesCollection) {
    describe("participant editor", function () {
      beforeEach(function () {
        this.typesCollection = new TypesCollection([{
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
        TypesCollection.instance = this.typesCollection;

        this.rolesCollection = new RolesCollection([{
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
        this.existingModel = new Backbone.Model({
          thing: {id: 10, name: "existing thing name"},
          type: {id: 1},
          importance: {id: 1}
        });
        this.newModel = new Backbone.Model({
          thing: {id: -1, name: "new thing name"}
        });
      });
      describe("rendering", function () {
        it("should show the thing's name if it exists", function () {
          this.participantEditor = new ParticipantEditor({
            model: this.existingModel,
            roles: this.rolesCollection
          });
          this.participantEditor.render();
          this.participantEditor.$(".name").text().should.equal("existing thing name");
        });
        it("should make the thing name's editable if it is a new thing", function () {
          this.participantEditor = new ParticipantEditor({
            model: this.newModel,
            roles: this.rolesCollection
          });
          this.participantEditor.render();
          this.participantEditor.$(".new-thing input[data-key=thing-name]").val().should.equal("new thing name");
        });
        it("should remove participants when the remove button is clicked", function () {
          this.participantEditor = new ParticipantEditor({
            model: this.newModel,
            roles: this.rolesCollection
          });
          this.participantEditor.render();
          sinon.stub(this.participantEditor.$el, "remove");
          this.participantEditor.removeParticipant();
          this.participantEditor.$el.remove.calledOnce.should.equal(true);
        });
      });

      describe("validation", function () {
        beforeEach(function () {
          this.participantEditor = new ParticipantEditor({
            model: this.newModel,
            roles: this.rolesCollection
          });
          this.participantEditor.render();
          sinon.stub(this.participantEditor.thingEditor, "validate");
          sinon.stub(this.participantEditor.typeSelector, "validate");
        });
        afterEach(function () {
          this.participantEditor.thingEditor.validate.restore();
          this.participantEditor.typeSelector.validate.restore();
        });
        it("should validate the thing if it is a new thing", function () {
          this.participantEditor.validate();
          this.participantEditor.thingEditor.validate.calledOnce.should.equal(true);
        });
        it("should validate the type", function () {
          this.participantEditor.validate();
          this.participantEditor.typeSelector.validate.calledOnce.should.equal(true);
        });
      });

      describe("getValue", function () {
        it("should get the value of the thing editor if it is a new thing", function () {
          this.participantEditor = new ParticipantEditor({
            model: this.newModel,
            roles: this.rolesCollection
          });
          this.participantEditor.render();
          sinon.stub(this.participantEditor.typeSelector, "getValue", function () {
            return {type: "type value"};
          });
          var value = this.participantEditor.getValue();
          value.thing.id.should.equal(-1);
          value.thing.name.should.equal("new thing name");
        });
        it("should get the id of the thing if it already exists", function () {
          this.participantEditor = new ParticipantEditor({
            model: this.existingModel,
            roles: this.rolesCollection
          });
          this.participantEditor.render();
          this.participantEditor.getValue().thing.id.should.equal(10);
        });
        it("should get the value of the type selector", function () {
          this.participantEditor = new ParticipantEditor({
            model: this.existingModel,
            roles: this.rolesCollection
          });
          this.participantEditor.render();
          sinon.stub(this.participantEditor.typeSelector, "getValue", function () {
            return {type: "type value"};
          });
          this.participantEditor.getValue().type.should.equal("type value");
        });
        it("should set the relatedTypeId", function () {
          this.participantEditor = new ParticipantEditor({
            model: this.existingModel,
            roles: this.rolesCollection
          });
          this.rolesCollection.setEventType(2);
          this.participantEditor.render();
          sinon.stub(this.participantEditor.typeSelector, "getValue", function () {
            return {type: {id: 1}};
          });
          this.participantEditor.getValue().type.related_type_id.should.equal(2);
        });
      });
    });
  }
);
