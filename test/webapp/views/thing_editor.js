/*global sinon, describe, it, beforeEach, afterEach */
define(

  ["underscore", "backbone", "views/thing_editor", "collections/types"],

  function (_, Backbone, ThingEditor, TypesCollection) {

    describe("thing editor", function () {
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
        this.thingEditor = new ThingEditor({
          name: "new thing"
        });
        this.thingEditor.render().appendTo(document.body);
        this.thingEditor.subtypes.updateData = _.bind(function () {
          this.thingEditor.subtypes.reset([{
            id: 1,
            name: "subtype 1",
            default_importance_id: 1,
            importances: [{
              id: 1,
              name: "st importance 1"
            }]
          }, {
            id: 2,
            name: "subtype 2",
            default_importance_id: 3,
            importances: [{
              id: 2,
              name: "st importance 2"
            }, {
              id: 3,
              name: "st importance 3"
            }]
          }]);
          return {
            then: function (fn) {
              fn();
            }
          };
        }, this);
      });
      afterEach(function () {
        this.thingEditor.remove();
      });
      describe("rendering", function () {
        it("should hide the thing subtype when it loads", function () {
          this.thingEditor.$(".subtypes-holder:visible").length.should.equal(0);
        });
        it("should show subtypes when the thing type is selected", function () {
          this.thingEditor.$("input[data-key=thing-type]").val(1);
          this.thingEditor.typeSelected();
          this.thingEditor.$(".subtypes-holder:visible").length.should.equal(1);
        });
        it("should add an empty subtype selector when the thing type is selected", function () {
          this.thingEditor.$(".subtypes .subtype").length.should.equal(0);
          this.thingEditor.$("input[data-key=thing-type]").val(1);
          this.thingEditor.typeSelected();
          this.thingEditor.$(".subtypes .subtype").length.should.equal(1);
        });
        it("should clear any selected subtypes when the thing type is selected", function () {
          this.thingEditor.$("input[data-key=thing-type]").val(1);
          this.thingEditor.typeSelected();
          this.thingEditor.$(".subtypes .subtype input[data-key=importance-name]")
            .val("to be removed");
          this.thingEditor.$(".subtypes .subtype input[data-key=importance-name]")
            .val().should.equal("to be removed");
          this.thingEditor.typeSelected();
          this.thingEditor.$(".subtypes .subtype input[data-key=importance-name]")
            .val().should.not.equal("to be removed");
        });
        it("should add a subtype when the add subtype button is clicked", function () {
          this.thingEditor.$("input[data-key=thing-type]").val(1);
          this.thingEditor.typeSelected();
          this.thingEditor.$(".subtypes .subtype").length.should.equal(1);
          this.thingEditor.$(".add-subtype").trigger("click");
          this.thingEditor.$(".subtypes .subtype").length.should.equal(2);
        });

        describe("adding subtypes", function () {
          it("should remove a subtype when the remove button is clicked", function () {
            this.thingEditor.$(".subtypes .subtype").length.should.equal(0);
            this.thingEditor.$("input[data-key=thing-type]").val(1);
            this.thingEditor.typeSelected();
            this.thingEditor.$(".subtypes .subtype").length.should.equal(1);
            this.thingEditor.$(".add-subtype").trigger("click");
            this.thingEditor.$(".subtypes .subtype").length.should.equal(2);
            this.thingEditor.$(".subtypes .subtype .remove-subtype").first().trigger("click");
            this.thingEditor.$(".subtypes .subtype").length.should.equal(1);
          });
          it("should ensure that the last subtype cannot be removed", function () {
            this.thingEditor.$(".subtypes .subtype").length.should.equal(0);
            this.thingEditor.$("input[data-key=thing-type]").val(1);
            this.thingEditor.typeSelected();
            this.thingEditor.$(".subtypes .subtype").length.should.equal(1);
            this.thingEditor.$(".subtypes .subtype .remove-subtype").first().trigger("click");
            this.thingEditor.$(".subtypes .subtype").length.should.equal(1);
          });
        });
      });

      describe("populateValues", function () {
        beforeEach(function () {
          this.thingEditor.model = new Backbone.Model({
            name: "some name",
            link: "some link",
            typeId: 2,
            subtypes: []
          });
        });
        it("should populate the name", function () {
          this.thingEditor.populateValues();
          this.thingEditor.$("input[data-key=thing-name]").val().should.equal("some name");
        });
        it("should populate the link", function () {
          this.thingEditor.populateValues();
          this.thingEditor.$("input[data-key=thing-link]").val().should.equal("some link");
        });
        it("should populate the type", function () {
          this.thingEditor.populateValues();
          this.thingEditor.$("input[data-key=thing-type]").val().should.equal("2");
        });
        it("should add subtypes when they exist", function () {
          this.thingEditor.model.set("subtypes", [
            {type: {id: 1}, importance: {id: 1}},
            {type: {id: 1}, importance: {id: 1}}
          ]);
          this.thingEditor.populateValues();
          this.thingEditor.$(".subtypes-holder .subtype").length.should.equal(2);
        });
        it("should add a default empty subtype when they do not exist", function () {
          this.thingEditor.populateValues();
          this.thingEditor.$(".subtypes-holder .subtype").length.should.equal(1);
        });
      });

      describe("getValue", function () {
        it("should get the thing name", function () {
          this.thingEditor.$("input[data-key=thing-name]").val("thing name 1");
          this.thingEditor.getValue().name.should.equal("thing name 1");
        });
        it("should get the thing link", function () {
          this.thingEditor.$("input[data-key=thing-link]").val("thing link 1");
          this.thingEditor.getValue().link.should.equal("thing link 1");
        });
        it("should get the thing type", function () {
          this.thingEditor.$("input[data-key=thing-type]").val(2);
          this.thingEditor.getValue().typeId.should.equal(2);
        });
        it("should get the subtype values", function () {
          this.thingEditor.$("input[data-key=thing-type]").val(1);
          this.thingEditor.typeSelected();
          this.thingEditor.$(".add-subtype").trigger("click");
          var called = 0;
          _.each(this.thingEditor.subtypeSelectors, function (typeSelector) {
            sinon.stub(typeSelector, "getValue", function () {
              called += 1;
            });
          });
          this.thingEditor.getValue().subtypes.length.should.equal(2);
          called.should.equal(2);
        });
      });

      describe("validate", function () {
        it("should ensure that a type has been selected", function () {
          this.thingEditor.validateType().should.equal(false);
          this.thingEditor.$("input[data-key=thing-type]").val(1);
          this.thingEditor.typeSelected();
          this.thingEditor.validateType().should.equal(true);
        });
        it("should ensure that each subtype has a value", function () {
          this.thingEditor.$("input[data-key=thing-type]").val(1);
          this.thingEditor.typeSelected();
          this.thingEditor.$(".add-subtype").trigger("click");
          var called = 0;
          _.each(this.thingEditor.subtypeSelectors, function (typeSelector) {
            sinon.stub(typeSelector, "validate", function () {
              called += 1;
              return true;
            });
          });
          this.thingEditor.validate();
          called.should.equal(2);
        });
        it("should ensure that duplicate subtypes are not selected", function () {
          this.thingEditor.$("input[data-key=thing-type]").val(1);
          this.thingEditor.typeSelected();
          this.thingEditor.$(".subtypes .subtype input[data-key=type]").last().select2("val", 1);
          this.thingEditor.$(".subtypes .subtype input[data-key=type]").last().trigger("change");
          this.thingEditor.$(".add-subtype").trigger("click");
          this.thingEditor.$(".subtypes .subtype input[data-key=type]").last().select2("val", 1);
          this.thingEditor.$(".subtypes .subtype input[data-key=type]").last().trigger("change");

          this.thingEditor.validateSubtypeDuplication().should.equal(false);
          this.thingEditor.$(".subtypes .subtype input[data-key=type]").last().select2("val", 2);

          this.thingEditor.validateSubtypeDuplication().should.equal(true);
        });
        it("should permit multiple new subtypes", function () {
          this.thingEditor.$("input[data-key=thing-type]").val(1);
          this.thingEditor.typeSelected();
          sinon.stub(this.thingEditor, "getSubtypeValues", function () {
            return [
              {type: {id: -1}},
              {type: {id: -1}}
            ];
          });
          this.thingEditor.validateSubtypeDuplication().should.equal(true);
          this.thingEditor.getSubtypeValues.restore();
        });
      });
    });

  }

);
