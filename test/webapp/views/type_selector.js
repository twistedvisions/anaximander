/*global sinon, describe, it, beforeEach, afterEach */
define(

  ["backbone", "views/type_selector", "analytics"],

  function (Backbone, TypeSelector, Analytics) {

    var isSelect2ized = function (el) {
      return el[0].className.indexOf("select2") > -1;
    };

    describe("type selector", function () {
      beforeEach(function () {
        this.typeSelector = new TypeSelector({
          types: new Backbone.Collection([{
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
          }])
        });
        this.typeSelector.render();
      });
      describe("rendering", function () {
        it("should select2-ize the types", function () {
          isSelect2ized(this.typeSelector.$("input[data-key=type]")).should.equal(true);
        });
        it("should select2-ize the importances", function () {
          isSelect2ized(this.typeSelector.$("input[data-key=importance]")).should.equal(true);
        });
        it("should update the data in the importances when the type changes", function () {
          this.typeSelector.$("input[data-key=type]").val(2);
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.$("input[data-key=importance]").data().select2.opts.data.length.should.equal(2);
        });
        it("should show the default importance of the selected type", function () {
          this.typeSelector.$("input[data-key=type]").val(2);
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.$("input[data-key=importance]").select2("data").id.should.equal(3);
        });
        it("should show the selected importance if the selected name exists", function () {
          this.typeSelector.$("input[data-key=type]").val(2);
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.$("input[data-key=importance]").select2("data",
            {id: 2, text: "importance 2"});
          this.typeSelector.$("input[data-key=importance]").trigger("change");
          this.typeSelector.$el.hasClass("selecting-importance").should.equal(true);
          this.typeSelector.$el.hasClass("editing-importance").should.equal(false);
        });
        it("should show the an importance creator if the selected name does not exist", function () {
          this.typeSelector.$("input[data-key=type]").val(2);
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.$("input[data-key=importance]").select2("data",
            {id: -1, text: "new importance"});
          this.typeSelector.$("input[data-key=importance]").trigger("change");
          this.typeSelector.$el.hasClass("selecting-importance").should.equal(false);
          this.typeSelector.$el.hasClass("editing-importance").should.equal(true);
        });
        it("should allow the user to cancel creating an importance", function () {
          this.typeSelector.$("input[data-key=type]").val(2);
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.$("input[data-key=importance]").select2("data",
            {id: -1, text: "new importance"});
          this.typeSelector.$("input[data-key=importance]").trigger("change");
          this.typeSelector.$el.hasClass("selecting-importance").should.equal(false);
          this.typeSelector.hideImportanceGroup({preventDefault: function () {}});
          this.typeSelector.$el.hasClass("selecting-importance").should.equal(true);
        });
        it("should fill in dummy values in the importance creator when it is hidden", function () {
          this.typeSelector.$("input[data-key=type]").val(2);
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.$el.hasClass("selecting-importance").should.equal(true);
          this.typeSelector.$("input[data-key=importance-name]").val().length.should.be.greaterThan(0);
          this.typeSelector.$("textarea[data-key=importance-description]").val().length.should.be.greaterThan(0);
          this.typeSelector.$("input[data-key=importance-value]").val().length.should.be.greaterThan(0);
        });
        it("should remove dummy values when the importance creator is shown", function () {
          this.typeSelector.$("input[data-key=type]").val(2);
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.$("input[data-key=importance]").select2("data",
            {id: -1, text: "new importance"});
          this.typeSelector.$("input[data-key=importance]").trigger("change");
          this.typeSelector.$el.hasClass("selecting-importance").should.equal(false);
          this.typeSelector.$("input[data-key=importance-name]").val().should.equal("new importance");
          this.typeSelector.$("textarea[data-key=importance-description]").val().length.should.equal(0);
          this.typeSelector.$("input[data-key=importance-value]").val().should.equal("5");
        });
        it("should create a default importance, when a new type is created", function () {
          this.typeSelector.$("input[data-key=type]").select2("data",
            {id: -1, text: "new type"});
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.$("input[data-key=importance]").select2("data")
            .should.eql({id: -2, text: "Nominal"});
        });

      });

      describe("getValue", function () {
        it("should get the type value for new types", function () {
          this.typeSelector.$("input[data-key=type]").select2("data",
            {id: -1, text: "new type"});
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.getValue().type.id.should.equal(-1);
          this.typeSelector.getValue().type.name.should.equal("new type");
        });
        it("should get the type value for existing types", function () {
          this.typeSelector.$("input[data-key=type]").val(2);
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.getValue().type.id.should.equal(2);
        });
        it("should get the importance value for new user-entered importances", function () {
          this.typeSelector.$("input[data-key=importance]").select2("data",
            {id: -1, text: "new importance"});
          this.typeSelector.$("input[data-key=importance]").trigger("change");
          this.typeSelector.$("textarea[data-key=importance-description]").val("new description");
          this.typeSelector.$("input[data-key=importance-value]").val(3);
          this.typeSelector.getValue().importance.id.should.equal(-1);
          this.typeSelector.getValue().importance.name.should.equal("new importance");
          this.typeSelector.getValue().importance.description.should.equal("new description");
          this.typeSelector.getValue().importance.value.should.equal(3);
        });
        it("should get the importance value for new default importances", function () {
          this.typeSelector.$("input[data-key=type]").select2("data",
            {id: -1, text: "Type Name"});this.typeSelector.setDefaultNewImportanceValue();
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.getValue().importance.id.should.equal(-2);
          this.typeSelector.getValue().importance.name.should.equal("Nominal");
          this.typeSelector.getValue().importance.description.should.equal("a default value of importance for Type Name");
          this.typeSelector.getValue().importance.value.should.equal(5);
        });
        it("should get the importance value for existing importances", function () {
          this.typeSelector.$("input[data-key=type]").val(2);
          this.typeSelector.$("input[data-key=type]").trigger("change");
          this.typeSelector.getValue().importance.id.should.equal(3);
        });
      });

      describe("setValue", function () {
        it("should select the type", function () {
          this.typeSelector.$("input[data-key=type]").select2("val").should.not.equal("1");
          this.typeSelector.setValue(2, 3);
          this.typeSelector.$("input[data-key=type]").select2("val").should.equal("2");
        });
        it("should populate the importance dropdown", function () {
          try {
            sinon.stub(this.typeSelector, "setImportanceDropdownValues");
            this.typeSelector.setValue(2, 3);
            this.typeSelector.setImportanceDropdownValues.args[0][0].length.should.equal(2);
          } finally {
            this.typeSelector.setImportanceDropdownValues.restore();
          }
        });
        it("should select the importance", function () {
          this.typeSelector.$("input[data-key=importance]").select2("val").should.not.equal("3");
          this.typeSelector.setValue(2, 3);
          this.typeSelector.$("input[data-key=importance]").select2("val").should.equal("3");
        });
      });

      describe("validate", function () {
        beforeEach(function () {
          this.typeSelector.$("input[data-key=type]").val(2);
          this.typeSelector.$("input[data-key=type]").trigger("change");
        });
        it("should validate the type selector", function () {
          this.typeSelector.validate().should.equal(true);
          this.typeSelector.$("input[data-key=type]").select2("data",
            {id: -1, text: "new type"});
          this.typeSelector.validate().should.equal(true);
        });
        it("should validate the importance selector, if it is an existing importance", function () {
          this.typeSelector.$("input[data-key=importance]").val(2);
          this.typeSelector.$("input[data-key=importance]").trigger("change");
          this.typeSelector.validate().should.equal(true);
        });
        it("should validate the importance name, if it is a new importance", function () {
          this.typeSelector.$("input[data-key=importance]").select2("data",
            {id: -1, text: "new importance"});
          this.typeSelector.$("input[data-key=importance]").trigger("change");

          this.typeSelector.$("textarea[data-key=importance-description]").val("new importance description");
          this.typeSelector.$("input[data-key=importance-name]").val("");
          this.typeSelector.validate().should.equal(false);
        });
        it("should validate the importance description, if it is a new importance", function () {
          this.typeSelector.$("input[data-key=importance]").select2("data",
            {id: -1, text: "new importance"});
          this.typeSelector.$("input[data-key=importance]").trigger("change");

          this.typeSelector.validate().should.equal(false);
          this.typeSelector.$("textarea[data-key=importance-description]").val("some importance description");
          this.typeSelector.validate().should.equal(true);
        });
        it("should validate the importance value, if it is a new importance", function () {
          this.typeSelector.$("input[data-key=importance]").select2("data",
            {id: -1, text: "new importance"});
          this.typeSelector.$("input[data-key=importance]").trigger("change");
          this.typeSelector.$("textarea[data-key=importance-description]").val("some importance description");

          this.typeSelector.validate().should.equal(true);
          this.typeSelector.$("input[data-key=importance-value]").val("");
          this.typeSelector.validate().should.equal(false);
        });
      });
      describe("analytics", function () {
        beforeEach(function () {
          sinon.stub(Analytics, "newTypeAdded");
          sinon.stub(Analytics, "newImportanceAdded");
        });
        afterEach(function () {
          Analytics.newTypeAdded.restore();
          Analytics.newImportanceAdded.restore();
        });
        it("should log when someone attempts to create a new role", function () {
          this.typeSelector.$("input[data-key=type]").select2("data",
            {id: -1, text: "new type"});
          this.typeSelector.$("input[data-key=type]").trigger("change");
          Analytics.newTypeAdded.calledOnce.should.equal(true);
        });
        it("should log when someone attempts to create a new importance", function () {
          this.typeSelector.$("input[data-key=importance]").select2("data",
            {id: -1, text: "new importance"});
          this.typeSelector.$("input[data-key=importance]").trigger("change");
          Analytics.newImportanceAdded.calledOnce.should.equal(true);
        });
      });

    });

  }

);
