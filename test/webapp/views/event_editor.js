/*global describe, it, beforeEach, afterEach, sinon */
define(

  ["chai", "underscore", "backbone", "when", "moment", "views/event_editor",
    "collections/roles", "collections/event_types", "collections/types",
    "analytics", "models/event"],

  function (chai, _, Backbone, when, moment, EventEditor,
      Roles, EventTypes, Types,
      Analytics, Event) {

    var should = chai.should();

    describe("event editor", function () {

      var selectParticipant = function (editor) {
        editor.$(".participant-editor input[data-key=type]").select2("val", 1).trigger("change");
        sinon.stub(editor, "getSelectedParticipant", function () {
          return {
            thing: {
              id: -1,
              name: "new thing name"
            }
          };
        });

        editor.addParticipant();

        editor
          .$(".participant-editor input[data-key=type]")
          .last()
          .select2("val", 2)
          .trigger("change");
      };

      var stubFetchData = function (editor) {
        sinon.stub(editor, "fetchData", function () {
          return {
            then: function (f) {
              f();
            }
          };
        });
      };

      beforeEach(function () {
        Roles.instance = new Roles();
        Roles.instance.reset([
          {
            id: 1,
            name: "role 1",
            default_importance_id: 10,
            importances: [{
              id: 10,
              name: "some importance name"
            }]
          }, {
            id: 2,
            name: "role 2",
            default_importance_id: 20,
            importances: [
              {
                id: 20,
                name: "some importance name1"
              },
              {
                id: 21,
                name: "some importance name2"
              }
            ]
          }
        ]);
        EventTypes.instance = new EventTypes();
        EventTypes.instance.reset([
          {
            id: 1,
            name: "event type 1",
            importances: [{
              id: 10,
              name: "some importance name 1"
            }, {
              id: 11,
              name: "some importance name 2"
            }]
          },
          {
            id: 2,
            name: "event type 2",
            importances: [{
              id: 20,
              name: "some importance name 2"
            }]
          }
        ]);
        this.typesCollection = new Types([{
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
        Types.instance = this.typesCollection;
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
          stubFetchData(this.editor);
        });
        afterEach(function () {
          this.editor.$el.find(".modal").modal("hide");
          this.editor.$el.remove();
        });
        describe("tabs", function () {
          it("should fetch the history only once when the history tab is selected", function () {
            sinon.stub(this.editor, "fetchHistory", function () {
              this.historyCollection = {};
              return when.resolve();
            });
            sinon.stub(this.editor, "renderHistory");
            this.editor.showHistoryTab();
            this.editor.showHistoryTab();
            this.editor.fetchHistory.calledOnce.should.equal(true);
          });
        });

        it("should set the end when the start is set if it is empty", function () {
          this.editor.render();
          this.editor.$("input[data-key=end]").val().should.equal("");
          this.editor.$("input[data-key=start]").val("2012-12-04");
          this.editor.$("input[data-key=start]").trigger("change");
          this.editor.$("input[data-key=end]").val().should.equal("2012-12-04 23:59");
          this.editor.$("input.date").datepicker("hide");
          this.editor.$el.find(".modal").modal("hide");
          this.editor.$el.remove();
        });

        it("should move the end when the start moves", function () {
          this.editor.render();
          this.editor.lastStart = moment("2012-12-04");
          this.editor.$("input[data-key=end]").val().should.equal("");
          this.editor.$("input[data-key=start]").val("2012-12-01");
          this.editor.$("input[data-key=start]").trigger("change");
          this.editor.$("input[data-key=end]").val().should.equal("2012-12-01 23:59");
          this.editor.$("input.date").datepicker("hide");
          this.editor.$el.find(".modal").modal("hide");
          this.editor.$el.remove();
        });

        it("should not move the end when the start is not the same day", function () {
          this.editor.render();
          this.editor.lastStart = moment("2012-12-04");
          this.editor.$("input[data-key=end]").val("2012-12-05");
          this.editor.$("input[data-key=start]").val("2012-12-04");
          this.editor.$("input[data-key=start]").trigger("change");
          this.editor.$("input[data-key=end]").val().should.equal("2012-12-05");
          this.editor.$("input.date").datepicker("hide");
          this.editor.$el.find(".modal").modal("hide");
          this.editor.$el.remove();
        });

        it("should add a participant when the participant select box changes", function () {
          sinon.stub(this.editor, "addParticipant");
          this.editor.render();
          this.editor.$("input[data-key=participants]").trigger("change");
          this.editor.addParticipant.calledOnce.should.equal(true);
        });
      });

      describe("participant selector", function () {
        beforeEach(function () {
          this.editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]})
          });
        });
        afterEach(function () {
          this.editor.$el.find(".modal").modal("hide");
          this.editor.$el.remove();
        });
        it("shouldn't allow you to select an existing thing", function () {
          this.editor.participants = {
            1: {
              model: new Backbone.Model({
                thing: {
                  id: 10
                }
              })
            }
          };
          var participants = this.editor.getSelectableParticipants([
            {
              id: 10
            },
            {
              id: 20
            }
          ]);
          participants.results.length.should.equal(1);
          participants.results[0].id.should.equal(20);
        });
      });
      describe("addParticipant", function () {
        beforeEach(function () {
          this.editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]})
          });
          stubFetchData(this.editor);
          this.editor.render();
          sinon.stub(this.editor, "getSelectedParticipant", function () {
            return {
              thing: {
                id: -1
              }
            };
          });
        });
        afterEach(function () {
          this.editor.$el.find(".modal").modal("hide");
          this.editor.$el.remove();
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
        beforeEach(function () {
          sinon.stub(Analytics, "participantAdded");
          sinon.stub(Analytics, "participantRemoved");
          sinon.stub(Analytics, "eventSaveClicked");
          sinon.stub(Analytics, "eventSaveValidationFailed");
          this.editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]})
          });
          stubFetchData(this.editor);
          this.editor.render();
          sinon.stub(this.editor, "getSelectedParticipant", function () {
            return {thing: {id: 1, name: "some name"}};
          });
        });
        afterEach(function () {
          this.editor.getSelectedParticipant.restore();
          Analytics.participantAdded.restore();
          Analytics.participantRemoved.restore();
          Analytics.eventSaveClicked.restore();
          Analytics.eventSaveValidationFailed.restore();
          this.editor.$el.find(".modal").modal("hide");
          this.editor.$el.remove();
        });
        it("should log when someone adds a participant", function () {
          this.editor.addParticipant();
          Analytics.participantAdded.calledOnce.should.equal(true);
        });
        it("should log when someone removes a participant", function () {
          this.editor.addParticipant();
          _.values(this.editor.participants)[0].trigger("remove");
          Analytics.participantRemoved.calledOnce.should.equal(true);
        });
        it("should log when a use clicks save", function () {
          this.editor.handleSave();
          Analytics.eventSaveClicked.calledOnce.should.equal(true);
        });
        it("should log when the validation fails", function () {
          this.editor.$("input[data-key=name]").val("");
          this.editor.handleSave();
          Analytics.eventSaveValidationFailed.calledOnce.should.equal(true);
        });
      });

      describe("editing", function () {
        beforeEach(function () {
          this.editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]}),
            model: new Backbone.Model()
          });
          stubFetchData(this.editor);
          this.editor.currentViewData = {
            id: 123,
            name: "existing event name",
            place: {
              id: 4,
              name: "existing place name"
            },
            link: "//www.link.com",
            type: {id: 1},
            importance: {id: 10},
            start_date: new Date(1900, 11, 12, 22).getTime(),
            end_date: new Date(2000, 0, 1, 21, 59).getTime(),
            start_offset_seconds: 2 * 60 * 60,
            end_offset_seconds: 2 * 60 * 60,
            participants: [
              {
                thing: {id: 3, name: "John Smith"},
                type: {id: 2},
                importance: {id: 20}
              }
            ]
          };
          this.editor.render();
          this.editor.nearestPlaces = [
            {id: 4, name: "existing place name", distance: 0},
            {id: 5, name: "existing place name1", distance: 1}
          ];
          this.editor.renderPlaces();
        });
        afterEach(function () {
          this.editor.$el.find(".modal").modal("hide");
          this.editor.$el.remove();
        });
        describe("rendering", function () {

          it("should make the reason required if it is a change", function () {
            this.editor.$("textarea[data-key=reason]").attr("required").length.should.not.equal(0);
          });
          it("should display the event name", function () {
            this.editor.$("input[data-key=name]").val().should.equal("existing event name");
          });
          it("should display the event place", function () {
            this.editor.$("input[data-key=place]").val().should.equal("4");
            this.editor.$("input[data-key=place]").select2("data").text.should.equal("existing place name (0m)");
          });
          it("should set the event type editor", function () {
            this.editor.eventTypeSelector.getValue().type.id.should.equal(1);
            this.editor.eventTypeSelector.getValue().importance.id.should.equal(10);
          });
          it("should set the event link", function () {
            this.editor.$("input[data-key=link]").val().should.equal("//www.link.com");
          });
          it("should set the event start date at the local time", function () {
            this.editor.$("input[data-key=start]").val().should.equal("1900-12-13 00:00");
          });
          it("should set the event end date at the local time", function () {
            this.editor.$("input[data-key=end]").val().should.equal("2000-01-01 23:59");
          });
          it("should show each event participant", function () {
            this.editor.$(".participant-editor").length.should.equal(1);
          });
          it("should not save if no changes were made", function () {
            this.editor.$("textarea[data-key=reason]").val("some reason");
            this.editor.validate().should.equal(false);
            this.editor.$("input[data-key=name]").val("some new name");
            this.editor.validate().should.equal(true);
          });
        });
        describe("updateExistingEvent", function () {
          describe("differences", function () {
            beforeEach(function () {
              this.shouldSucceed = true;
              sinon.stub(this.editor, "getDifferences", _.bind(function () {
                return this.differences;
              }, this));
              sinon.stub(this.editor, "sendChangeRequest", _.bind(function () {
                if (this.shouldSucceed) {
                  return when.resolve();
                } else {
                  return when.reject();
                }
              }, this));
            });
            it("should make a server call when there are differences", function (done) {
              this.differences = {
                name: "new name"
              };
              sinon.stub(this.editor, "handleSaveComplete");
              this.editor.updateExistingEvent();
              _.defer(
                _.bind(function () {
                  var ex;
                  try {
                    this.editor.handleSaveComplete.calledOnce.should.equal(true);
                  } catch (e) {
                    ex = e;
                  }
                  done(ex);
                }, this)
              );
            });
            it("should not make a server call when there are no differences", function (done) {
              this.differences = {};
              sinon.stub(this.editor, "handleSaveComplete");
              this.editor.updateExistingEvent();
              _.defer(
                _.bind(function () {
                  var ex;
                  try {
                    this.editor.handleSaveComplete.calledOnce.should.equal(false);
                  } catch (e) {
                    ex = e;
                  }
                  done(ex);
                }, this)
              );
            });
            it("should contain the last_edit time in the differences", function (done) {
              this.differences = {
                name: "new name"
              };
              var time = new Date();
              this.editor.model.set("last_edited", time);
              sinon.stub(this.editor, "handleSaveComplete");
              this.editor.updateExistingEvent();
              _.defer(
                _.bind(function () {
                  var ex;
                  try {
                    this.editor.sendChangeRequest.args[0][0].last_edited.should.eql(time);
                  } catch (e) {
                    ex = e;
                  }
                  done(ex);
                }, this)
              );
            });
            it("should call handleSaveFail when the request failed", function (done) {
              this.differences = {
                name: "new name"
              };
              this.shouldSucceed = false;
              sinon.stub(this.editor, "handleSaveFail");
              this.editor.updateExistingEvent();
              _.defer(
                _.bind(function () {
                  var ex;
                  try {
                    this.editor.handleSaveFail.calledOnce.should.equal(true);
                  } catch (e) {
                    ex = e;
                  }
                  done(ex);
                }, this)
              );
            });
          });
        });
        describe("saving", function () {
          describe("analytics", function () {
            beforeEach(function () {
              sinon.stub(Analytics, "eventSaved");
              sinon.stub(Analytics, "eventSaveClicked");
              sinon.stub(this.editor, "sendChangeRequest", function () {
                return when.resolve();
              });
              sinon.stub(this.editor, "updateHighlight");

            });
            afterEach(function () {
              Analytics.eventSaved.restore();
              this.editor.sendChangeRequest.restore();
              this.editor.updateHighlight.restore();
            });
            it("should track when an event is saved", function (done) {
              this.editor.$("input[data-key=name]").val("something different");
              this.editor.handleSave().then(function () {
                var ex;
                try {
                  Analytics.eventSaved.calledOnce.should.equal(true);
                } catch (e) {
                  ex = e;
                }
                done(ex);
              }, done);
            });
          });
          describe("raw differences", function () {
            it("should return one difference if the name has changed", function () {
              this.editor.$("input[data-key=name]").val("something different");
              var differences = this.editor.getRawDifferences(this.editor.model.toJSON(), this.editor.collectValues());
              differences.length.should.equal(1);
            });
          });
          describe("collectValues", function () {
            it("should collect the start time in UTC time", function () {
              this.editor.$("input[data-key=start]").val("1900-12-13 00:00");
              this.editor.collectValues().start_date.toISOString().should.equal("1900-12-12T22:00:00.000Z");
            });
            it("should collect the end time in UTC time", function () {
              this.editor.$("input[data-key=end]").val("2000-01-01 23:59");
              this.editor.collectValues().end_date.toISOString().should.equal("2000-01-01T21:59:00.000Z");
            });
          });
          describe("differences", function () {
            beforeEach(function () {
              sinon.stub(this.editor, "getTimezoneOffset", function () {
                return -60;
              });
            });
            afterEach(function () {
              this.editor.getTimezoneOffset.restore();
            });
            it("should always have an id", function () {
              this.editor.$("input[data-key=name]").val("something different");
              this.editor.getDifferences(this.editor.collectValues()).id.should.equal(123);
            });
            it("should always have a reason", function () {
              this.editor.$("textarea[data-key=reason]").val("the reason");
              this.editor.getDifferences(this.editor.collectValues()).reason.should.equal("the reason");
            });
            it("shouldn't diff the offset", function () {
              this.editor.$("input[data-key=name]").val("something different");
              should.not.exist(this.editor.getDifferences(this.editor.collectValues()).start_offset_seconds);
              should.not.exist(this.editor.getDifferences(this.editor.collectValues()).end_offset_seconds);
            });
            it("should send the name if it has changed", function () {
              this.editor.$("input[data-key=name]").val("something different");
              this.editor.getDifferences(this.editor.collectValues()).name.should.equal("something different");
            });
            it("should send the link if it has changed", function () {
              this.editor.$("input[data-key=link]").val("//www.someotherlink.com");
              this.editor.getDifferences(this.editor.collectValues()).link.should.equal("//www.someotherlink.com");
            });
            it("should send the placeId if it has changed", function () {
              this.editor.$("input[data-key=place]").select2("val", 5);
              this.editor.getDifferences(this.editor.collectValues()).placeId.should.equal(5);
            });
            it("should send the start in utc without the browsers timezone if it has changed", function () {
              this.editor.$("input[data-key=start]").val("1500-12-24 00:00");
              this.editor.getDifferences(this.editor.collectValues()).start_date.should.eql(new Date(1500, 11, 23, 23).toISOString());
            });
            it("should send the end in utc without the browsers timezone  if it has changed", function () {
              this.editor.$("input[data-key=end]").val("2010-11-20 23:59");
              this.editor.getDifferences(this.editor.collectValues()).end_date.should.eql(new Date(2010, 10, 20, 22, 59).toISOString());
            });
            it("should remove the timezone from the start date if it exists", function () {
              this.editor.$("input[data-key=start]").val("2010-10-20 00:00");
              this.editor.getDifferences(this.editor.collectValues()).start_date.should.eql(new Date(2010, 9, 19, 23).toISOString());
            });
            it("should remove the timezone from the end date if it exists", function () {
              this.editor.$("input[data-key=end]").val("2010-10-20 23:59");
              this.editor.getDifferences(this.editor.collectValues()).end_date.should.eql(new Date(2010, 9, 20, 22, 59).toISOString());
            });
            it("should send the event type if it has changed to a different existing one", function () {
              this.editor.eventTypeSelector.setValue(2, 20);
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.type.id.should.equal(2);
              should.not.exist(differences.type.name);
            });
            it("should send the event importance if the event type has changed to a different existing one", function () {
              this.editor.eventTypeSelector.setValue(2, 20);
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.importance.id.should.equal(20);
              should.not.exist(differences.importance.name);
            });
            it("should send the event type if it has changed to a new one", function () {
              this.editor.eventTypeSelector.$("input[data-key=type]").select2(
                _.extend(this.editor.eventTypeSelector.importanceSelectData, {
                data: [{
                  id: -1,
                  text: "new type name"
                }]
              }));
              this.editor.eventTypeSelector.$("input[data-key=type]").select2("val", -1).trigger("change");
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.type.id.should.equal(-1);
              differences.type.name.should.equal("new type name");
            });
            it("should send the event importance if the event type has changed to a new one", function () {
              this.editor.eventTypeSelector.$("input[data-key=type]").select2(
                _.extend(this.editor.eventTypeSelector.importanceSelectData, {
                data: [{
                  id: -1,
                  text: "new type name"
                }]
              }));
              this.editor.eventTypeSelector.$("input[data-key=type]").select2("val", -1).trigger("change");
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.importance.id.should.be.lessThan(0);
              differences.importance.name.should.equal("Nominal");
            });
            it("should send the event importance if has changed to a different existing one", function () {
              this.editor.eventTypeSelector.$("input[data-key=importance]").select2("val", 11).trigger("change");
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.importance.id.should.equal(11);
              should.not.exist(differences.importance.name);
            });
            it("should send the event importance", function () {
              this.editor.eventTypeSelector.setDefaultNewImportanceValue();
              this.editor.eventTypeSelector.$("input[data-key=importance-description]").val("new description");
              this.editor.eventTypeSelector.$("input[data-key=importance-value]").val(3);
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.importance.id.should.be.lessThan(0);
              differences.importance.name.should.equal("Nominal");
              differences.importance.description.should.equal("a default value of importance for event type 1");
              differences.importance.value.should.equal(5);
            });
            it("should send new participants", function () {
              selectParticipant(this.editor);
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.newParticipants[0].thing.id.should.equal(-1);
              differences.newParticipants[0].type.id.should.equal(2);
              differences.newParticipants[0].importance.id.should.equal(20);
            });
            it("should send new and changed participants together", function () {
              selectParticipant(this.editor);
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.newParticipants.length.should.equal(1);
              differences.editedParticipants.length.should.equal(1);
            });
            it("should send removed participants", function () {
              this.editor.$(".remove-participant").trigger("click");
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.removedParticipants.should.eql([3]);
            });
            it("should send participants with changed existing role", function () {
              this.editor.$(".participant-editor input[data-key=type]").select2("val", 1).trigger("change");
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.editedParticipants.length.should.equal(1);
              differences.editedParticipants[0].thing.id.should.equal(3);
              should.not.exist(differences.editedParticipants[0].thing.name);
              differences.editedParticipants[0].type.id.should.equal(1);
              should.not.exist(differences.editedParticipants[0].type.name);
              differences.editedParticipants[0].importance.id.should.equal(10);
              should.not.exist(differences.editedParticipants[0].importance.name);
            });
            it("should send participants with changed new role", function () {
              this.editor.$(".participant-editor input[data-key=type]").select2(
                _.extend(this.editor.eventTypeSelector.importanceSelectData, {
                data: [{
                  id: -1,
                  text: "new type name"
                }]
              }));
              this.editor.$(".participant-editor input[data-key=type]").select2("val", -1).trigger("change");
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.editedParticipants.length.should.equal(1);
              differences.editedParticipants[0].thing.id.should.equal(3);
              should.not.exist(differences.editedParticipants[0].thing.name);
              differences.editedParticipants[0].type.id.should.equal(-1);
              differences.editedParticipants[0].type.name.should.equal("new type name");
              differences.editedParticipants[0].importance.id.should.be.lessThan(0);
              differences.editedParticipants[0].importance.name.should.equal("Nominal");
            });
            it("should send participants with changed existing importance", function () {
              this.editor.$(".participant-editor input[data-key=importance]").select2("val", 21).trigger("change");
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.editedParticipants.length.should.equal(1);
              differences.editedParticipants[0].thing.id.should.equal(3);
              should.not.exist(differences.editedParticipants[0].thing.name);
              should.not.exist(differences.editedParticipants[0].type);
              differences.editedParticipants[0].importance.id.should.equal(21);
              should.not.exist(differences.editedParticipants[0].importance.name);
            });
            it("should send participants with changed new importance", function () {
              this.editor.$(".participant-editor input[data-key=importance]").select2(
                _.extend(this.editor.eventTypeSelector.importanceSelectData, {
                data: [{
                  id: -1,
                  text: "new importance name"
                }]
              }));
              this.editor.$(".participant-editor input[data-key=importance]").select2("val", -1).trigger("change");
              var differences = this.editor.getDifferences(this.editor.collectValues());
              differences.editedParticipants.length.should.equal(1);
              differences.editedParticipants[0].thing.id.should.equal(3);
              should.not.exist(differences.editedParticipants[0].thing.name);
              should.not.exist(differences.editedParticipants[0].type);
              differences.editedParticipants[0].importance.id.should.equal(-1);
              differences.editedParticipants[0].importance.name.should.equal("new importance name");
            });
            it("should not remove elements from participants", function () {
              var values = {
                start_date: moment(),
                end_date: moment(),
                participants: [{thing: {id: 1234}}]
              };
              this.editor.getDifferences(values);
              values.participants.length.should.equal(1);
            });
            it("should not send empty newParticipants", function () {
              var values = {
                start_date: moment(),
                end_date: moment()
              };
              should.not.exist(this.editor.getDifferences(values).newParticipants);
            });
            it("should not send empty removedParticipants", function () {
              var values = {
                start_date: moment(),
                end_date: moment(),
                participants: [{thing: {id: 3}}]
              };
              should.not.exist(this.editor.getDifferences(values).removedParticipants);
            });
          });
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
          stubFetchData(this.editor);
          this.editor.startOffset = 0;
          this.editor.endOffset = 0;
          this.editor.render();
          this.editor.$("input[data-key=name]").val("some name");
          this.editor.$("input[data-key=link]").val("some link");
          this.editor.$("input[data-key=start]").val("2012-12-04");
          this.editor.$("input[data-key=end]").val("2012-12-05");
          this.editor.$("input[data-key=place]").val("some place name");
          this.editor.$("input[data-key=place]").select2("data", {id: 1, text: "some place"});
          this.editor.$("input[data-key=type]").select2("data", {id: 1, text: "some type"});
          this.editor.$("input[data-key=importance]").select2("data", {id: 1, text: "some importance"});

          selectParticipant(this.editor);

        });

        afterEach(function () {
          Analytics.eventAdded.restore();
          Event.prototype.save.restore();
          this.editor.$el.find(".modal").modal("hide");
          this.editor.$el.remove();
        });

        it("should not make the reason required if it saving a new event", function () {
          should.not.exist(this.editor.$("textarea[data-key=reason]").attr("required"));
        });
        it("should hide the reason if it is a new event", function () {
          this.editor.$("textarea[data-key=reason]").parent().css("display").should.equal("none");
        });

        it("should track when an event is added", function (done) {
          sinon.stub(this.editor, "updateHighlight");
          this.editor.handleSave().then(function () {
            Analytics.eventAdded.calledOnce.should.equal(true);
            done();
          });
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

        describe("validation", function () {
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

          it("should not save if the end is before the start", function () {
            this.editor.$("input[data-key=start]").val("2000-01-02 00:00");
            this.editor.$("input[data-key=end]").val("2000-01-01 23:59");
            this.editor.handleSave();
            this.editor.eventsCollection.toJSON().length.should.equal(0);
          });

          it("should not save if no participants are added", function () {
            this.editor.participants[_.keys(this.editor.participants)[0]].trigger("remove");
            this.editor.$(".participant-editor").remove();
            _.keys(this.editor.participants).length.should.equal(0);
            this.editor.eventsCollection.toJSON().length.should.equal(0);
            this.editor.handleSave();
            this.editor.eventsCollection.toJSON().length.should.equal(0);
          });

        });

        it("should update the highlight if the added participant is already highlighted", function () {
          this.editor.state.set("highlight", {id: 123});
          this.editor.updateHighlight({participants: [{thing: {id: 123}}]});
          this.editor.state.get("highlight").reset.should.equal(true);
        });

        it("should not update the highlight if the added participant is not highlighted", function () {
          this.editor.state.set("highlight", {id: 123});
          this.editor.model = new Backbone.Model({
            participants: []
          });
          this.editor.updateHighlight({participants: [{thing: {id: 1234}}]});
          (this.editor.state.get("highlight").reset === undefined).should.equal(true);
        });

        it("should update the highlight if a removed participant is not highlighted", function () {
          this.editor.state.set("highlight", {id: 123});
          this.editor.model = new Backbone.Model({
            participants: [{thing: {id: 123}}]
          });
          this.editor.updateHighlight({participants: []});
          this.editor.state.get("highlight").reset.should.equal(true);
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

        describe("handleSaveFail", function () {
          it("should put a custom message in if someone else edited the event", function () {
            this.editor.handleSaveFail(null, {responseText: "last_edited times do not match"});
            this.editor.$(".error-message").text().indexOf("Event can't be saved").should.equal(0);
          });
        });
      });

      describe("closing", function () {
        it("should remove the form from the DOM when it is closed", function () {
          this.editor = new EventEditor({
            state: new Backbone.Model({date: [1900, 2000]})
          });
          stubFetchData(this.editor);
          this.editor.render();
          this.editor.$(".modal").trigger("hidden.bs.modal");
          this.editor.$el.parent().length.should.equal(0);
        });
      });
    });
  }
);
