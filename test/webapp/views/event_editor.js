/*global describe, it, beforeEach, afterEach, sinon */
define(

  ["chai", "underscore", "backbone", "when", "moment", "views/event_editor",
    "models/event", "collections/roles", "collections/event_types", "collections/types",
    "analytics", "models/event"],

  function (chai, _, Backbone, when, moment, EventEditor, Event,
      Roles, EventTypes, Types,
      Analytics, Event) {

    var should = chai.should();

    describe("event editor", function () {

      var selectParticipant = function (editor) {

        editor.$(".participant-editor input[data-key=type]")
          .last()
          .select2("val", 1)
          .trigger("change");

        sinon.stub(editor, "getSelectedParticipant", function () {
          return {
            thing: {
              id: 1,
              name: "existant thing name"
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
        sinon.stub(Roles.instance, "fetch");
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
        Roles.instance.fetch.restore();
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
          sinon.stub(this.editor, "show");
          stubFetchData(this.editor);
        });
        afterEach(function () {
          this.editor.show.restore();
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
          this.editor.model = new Event({
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
                type: {id: 2, related_type_id: 1},
                importance: {id: 20}
              },
              {
                thing: {id: 4, name: "Joan Doe"},
                type: {id: 2, related_type_id: 1},
                importance: {id: 20}
              }
            ]
          }, {parse: true});
          //rendering times is slow, so only do it when necessary
          sinon.stub(this.editor, "renderTimes");
          this.editor.nearestPlaces = [
            {id: 4, name: "existing place name", distance: 0},
            {id: 5, name: "existing place name1", distance: 1200}
          ];
        });
        afterEach(function () {
          this.editor.$el.find(".modal").modal("hide");
          this.editor.$el.remove();
        });
        describe("rendering", function () {

          it("should make the reason required if it is a change", function () {
            this.editor.render();
            this.editor.$("textarea[data-key=reason]").attr("required").length.should.not.equal(0);
          });
          it("should display the event name", function () {
            this.editor.render();
            this.editor.$("input[data-key=name]").val().should.equal("existing event name");
          });
          it("should display the event place without distance if right there", function () {
            this.editor.render();
            this.editor.$("input[data-key=place]").val().should.equal("4");
            this.editor.$("input[data-key=place]").select2("data").text.should.equal("existing place name");
          });
          it("should display the event place with distance if further away", function () {
            this.editor.render();
            this.editor.$("input[data-key=place]").select2("val", 5);
            this.editor.$("input[data-key=place]").val().should.equal("5");
            this.editor.$("input[data-key=place]").select2("data").text.should.equal("existing place name1 (1.2 km)");
          });
          it("should set the event type editor", function () {
            this.editor.render();
            this.editor.eventTypeSelector.getValue().type.id.should.equal(1);
            this.editor.eventTypeSelector.getValue().importance.id.should.equal(10);
          });
          it("should set the event link", function () {
            this.editor.render();
            this.editor.$("input[data-key=link]").val().should.equal("//www.link.com");
          });
          it("should set the event start date at the local time", function () {
            this.editor.renderTimes.restore();
            this.editor.render();
            this.editor.$("input[data-key=start]").val().should.equal("1900-12-13 00:00");
          });
          it("should set the event end date at the local time", function () {
            this.editor.renderTimes.restore();
            this.editor.render();
            this.editor.$("input[data-key=end]").val().should.equal("2000-01-01 23:59");
          });
          it("should show each event participant", function () {
            this.editor.render();
            this.editor.$(".participant-editor").length.should.equal(2);
          });
          it("should not save if no changes were made", function () {
            this.editor.renderTimes.restore();
            this.editor.render();
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
              sinon.stub(this.editor.model, "update", _.bind(function () {
                if (this.shouldSucceed) {
                  return when.resolve();
                } else {
                  return when.reject();
                }
              }, this));
            });
            it("should make a server call when there are differences", function (done) {
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
              this.shouldSucceed = false;
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
              sinon.stub(this.editor, "updateHighlight");
              this.editor.render();
            });
            afterEach(function () {
              Analytics.eventSaved.restore();
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
          describe("collectValues", function () {
            it("should collect the start time in UTC time", function () {
              this.editor.render();
              this.editor.$("input[data-key=start]").val("1900-12-13 00:00");
              this.editor.collectValues().start_date.toISOString().should.equal("1900-12-12T22:00:00.000Z");
            });
            it("should collect the end time in UTC time", function () {
              this.editor.render();
              this.editor.$("input[data-key=end]").val("2000-01-01 23:59");
              this.editor.collectValues().end_date.toISOString().should.equal("2000-01-01T21:59:00.000Z");
            });
            it("should strip out the name from the event type if the type exists", function () {
              this.editor.render();
              this.editor.eventTypeSelector.setValue(2, 20);
              var values = this.editor.collectValues();
              values.type.id.should.equal(2);
              should.not.exist(values.type.name);
            });
            it("should strip out the name from the event importance if they exist", function () {
              this.editor.render();
              this.editor.eventTypeSelector.setValue(2, 20);
              var values = this.editor.collectValues();
              values.importance.id.should.equal(20);
              should.not.exist(values.importance.name);
            });
            it("should get all the values for new importances", function () {
              this.editor.render();
              this.editor.eventTypeSelector.setDefaultNewImportanceValue();
              this.editor.eventTypeSelector.$("input[data-key=importance-description]").val("new description");
              this.editor.eventTypeSelector.$("input[data-key=importance-value]").val(3);

              var values = this.editor.collectValues();
              values.importance.id.should.be.lessThan(0);
              values.importance.name.should.equal("Nominal");
              values.importance.description.should.equal("a default value of importance for event type 1");
              values.importance.value.should.equal(5);
            });
            it("should collect new participants", function () {
              this.editor.render();
              selectParticipant(this.editor);
              var values = this.editor.collectValues();
              values.participants[2].thing.id.should.equal(1);
              values.participants[2].type.id.should.equal(2);
              values.participants[2].importance.id.should.equal(20);
            });
            it("should collect changed participants", function () {
              this.editor.render();
              selectParticipant(this.editor);
              var values = this.editor.collectValues();
              values.participants[1].type.id.should.equal(1);
            });
            it("should not collect removed participants", function () {
              this.editor.render();
              this.editor.$(".remove-participant").first().trigger("click");
              var values = this.editor.collectValues();
              values.participants.length.should.equal(1);
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
          sinon.stub(this.editor, "hide");
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
          sinon.stub(this.editor, "hide");
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
          this.editor.handleSaveFail({responseText: "some error message"});
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

        it("should not prepend // if the url is empty", function () {
          this.editor.$("input[data-key=link]").val("");
          this.editor.handleSave();
          this.editor.eventsCollection.toJSON()[0].link
            .should.equal("");
        });

        describe("handleSaveFail", function () {
          it("should put a custom message in if someone else edited the event", function () {
            this.editor.handleSaveFail({responseText: "last_edited times do not match"});
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
