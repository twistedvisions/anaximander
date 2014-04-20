/*global describe, it, beforeEach, afterEach, sinon */
define(

  ["chai", "underscore", "backbone", "when", "moment", "views/event_editor",
    "models/event", "collections/roles", "collections/event_types", "collections/types",
    "analytics", "models/event"],

  function (chai, _, Backbone, when, moment, EventEditor, Event,
      Roles, EventTypes, Types,
      Analytics, Event) {

    var should = chai.should();

    describe("event model", function () {
      describe("differences", function () {

        describe("last_edit time", function () {

          beforeEach(function () {
            this.event = new Event();
            sinon.stub(this.event, "getDifferences", _.bind(function () {
              return this.differences;
            }, this));
            sinon.stub(this.event, "sendChangeRequest", _.bind(function () {
              if (this.shouldSucceed) {
                return when.resolve();
              } else {
                return when.reject();
              }
            }, this));
          });

          it("should contain the last_edit time in the differences", function (done) {
            this.differences = {
              name: "new name"
            };
            var time = new Date();
            this.event.set("last_edited", time);
            this.event.update();
            _.defer(
              _.bind(function () {
                var ex;
                try {
                  this.event.sendChangeRequest.args[0][0].last_edited.should.eql(time);
                } catch (e) {
                  ex = e;
                }
                done(ex);
              }, this)
            );
          });
        });

        describe("individual values", function () {
          beforeEach(function () {
            this.oldValues = {
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
                },
                {
                  thing: {id: 4, name: "John Smith"},
                  type: {id: 2},
                  importance: {id: 20}
                }
              ]
            };
            this.newValues = JSON.parse(JSON.stringify(this.oldValues));

            Event.prototype.parse.apply(Event.prototype, [this.newValues]);

            this.event = new Event(this.oldValues, {parse: true});
            sinon.stub(this.event, "getTimezoneOffset", function () {
              return -60;
            });
          });
          afterEach(function () {
            this.event.getTimezoneOffset.restore();
          });

          it("should always have an id", function () {
            this.newValues.name = "something different";
            var differences = this.event.getDifferences(this.newValues);
            differences.id.should.equal(123);
          });
          it("shouldn't diff the offset", function () {
            this.newValues.name = "something different";
            var differences = this.event.getDifferences(this.newValues);
            should.not.exist(differences.start_offset_seconds);
            should.not.exist(differences.end_offset_seconds);
          });
          it("should send the name if it has changed", function () {
            this.newValues.name = "something different";
            var differences = this.event.getDifferences(this.newValues);
            differences.name.should.equal("something different");
          });
          it("should send the link if it has changed", function () {
            this.newValues.link = "//www.someotherlink.com";
            var differences = this.event.getDifferences(this.newValues);
            differences.link.should.equal("//www.someotherlink.com");
          });
          it("should send the placeId if it has changed", function () {
            this.newValues.place = {id: 5};
            var differences = this.event.getDifferences(this.newValues);
            differences.placeId.should.equal(5);
          });
          it("should send the start in utc without the browsers timezone if it has changed", function () {
            //this date is in UTC
            this.newValues.start_date = moment("1500-12-23 22:00");
            var differences = this.event.getDifferences(this.newValues);
            differences.start_date.should.eql(new Date(1500, 11, 23, 23).toISOString());
          });
          it("should send the end in utc without the browsers timezone if it has changed", function () {
            //this date is in UTC
            this.newValues.end_date = moment("2010-11-20 21:59");
            var differences = this.event.getDifferences(this.newValues);
            differences.end_date.should.eql(new Date(2010, 10, 20, 22, 59).toISOString());
          });
          it("should send the event type if it has changed to a different existing one", function () {
            this.newValues.type = {id: 2};
            this.newValues.importance = {id: 20};
            var differences = this.event.getDifferences(this.newValues);
            differences.type.id.should.equal(2);
          });
          it("should send the event importance if the event type has changed to a different existing one", function () {
            this.newValues.type = {id: 2};
            this.newValues.importance = {id: 20};
            var differences = this.event.getDifferences(this.newValues);
            differences.importance.id.should.equal(20);
          });
          it("should send the event type if it has changed to a new one", function () {
            this.newValues.type = {id: -1, name: "new type name"};
            this.newValues.importance = {id: 20};
            var differences = this.event.getDifferences(this.newValues);
            differences.type.id.should.equal(-1);
            differences.type.name.should.equal("new type name");
          });
          it("should send the event importance if the event type has changed to a new one", function () {
            this.newValues.importance = {id: -1, name: "Nominal"};
            var differences = this.event.getDifferences(this.newValues);
            differences.importance.id.should.be.lessThan(0);
            differences.importance.name.should.equal("Nominal");
          });
          it("should send the event importance if has changed to a different existing one", function () {
            this.newValues.importance = {id: 11};
            var differences = this.event.getDifferences(this.newValues);
            differences.importance.id.should.equal(11);
          });
          it("should send the event importance for new importances", function () {
            this.newValues.importance = {
              id: -1,
              name: "Nominal",
              description: "new description",
              value: 5
            };
            var differences = this.event.getDifferences(this.newValues);
            differences.importance.id.should.be.lessThan(0);
            differences.importance.name.should.equal("Nominal");
            differences.importance.description.should.equal("new description");
            differences.importance.value.should.equal(5);
          });
          it("should send new participants", function () {
            this.newValues.participants = [{
              thing: {id: 1},
              type: {id: 2},
              importance: {id: 20}
            }];
            var differences = this.event.getDifferences(this.newValues);
            differences.newParticipants[0].thing.id.should.equal(1);
            differences.newParticipants[0].type.id.should.equal(2);
            differences.newParticipants[0].importance.id.should.equal(20);
          });
          it("should send new and changed participants together", function () {
            this.newValues.participants = [
              {
                thing: {id: 1},
                type: {id: 2},
                importance: {id: 20}
              },
              {
                thing: {id: 3, name: "John Smith"},
                type: {id: 2},
                importance: {id: 21}
              },
              {
                thing: {id: 4, name: "John Smith"},
                type: {id: 2},
                importance: {id: 20}
              }
            ];
            var differences = this.event.getDifferences(this.newValues);
            differences.newParticipants.length.should.equal(1);
            differences.editedParticipants.length.should.equal(1);
          });
          it("should send removed participants", function () {
            this.newValues.participants = [
              {
                thing: {id: 4, name: "John Smith"},
                type: {id: 2},
                importance: {id: 20}
              }
            ];
            var differences = this.event.getDifferences(this.newValues);
            differences.removedParticipants.should.eql([3]);
          });
          it("should send multiple removed participants", function () {
            this.newValues.participants = [];
            var differences = this.event.getDifferences(this.newValues);
            differences.removedParticipants.should.eql([3, 4]);
          });
          it("should send participants with changed existing role", function () {
            this.newValues.participants = [
              {
                thing: {id: 3, name: "John Smith"},
                type: {id: 1},
                importance: {id: 10}
              },
              {
                thing: {id: 4, name: "John Smith"},
                type: {id: 2},
                importance: {id: 20}
              }
            ];
            var differences = this.event.getDifferences(this.newValues);

            differences.editedParticipants.length.should.equal(1);
            differences.editedParticipants[0].thing.id.should.equal(3);
            differences.editedParticipants[0].type.id.should.equal(1);
            differences.editedParticipants[0].importance.id.should.equal(10);
          });
          it("should send participants with changed new role", function () {
            this.newValues.participants = [
              {
                thing: {id: 3, name: "John Smith"},
                type: {id: -1, name: "new type name"},
                importance: {id: -1, name: "Nominal"}
              },
              {
                thing: {id: 4, name: "John Smith"},
                type: {id: 2},
                importance: {id: 20}
              }
            ];
            var differences = this.event.getDifferences(this.newValues);

            differences.editedParticipants.length.should.equal(1);
            differences.editedParticipants[0].thing.id.should.equal(3);
            should.not.exist(differences.editedParticipants[0].thing.name);
            differences.editedParticipants[0].type.id.should.equal(-1);
            differences.editedParticipants[0].type.name.should.equal("new type name");
            differences.editedParticipants[0].importance.id.should.be.lessThan(0);
            differences.editedParticipants[0].importance.name.should.equal("Nominal");
          });
          it("should send participants with changed existing importance", function () {
            this.newValues.participants = [
              {
                thing: {id: 3, name: "John Smith"},
                type: {id: 2},
                importance: {id: 21}
              },
              {
                thing: {id: 4, name: "John Smith"},
                type: {id: 2},
                importance: {id: 20}
              }
            ];
            var differences = this.event.getDifferences(this.newValues);

            differences.editedParticipants.length.should.equal(1);
            differences.editedParticipants[0].thing.id.should.equal(3);
            should.not.exist(differences.editedParticipants[0].thing.name);
            differences.editedParticipants[0].type.id.should.equal(2);
            differences.editedParticipants[0].importance.id.should.equal(21);
            should.not.exist(differences.editedParticipants[0].importance.name);
          });
          it("should send participants with changed new importance", function () {
            this.newValues.participants = [
              {
                thing: {id: 3, name: "John Smith"},
                type: {id: 2},
                importance: {
                  id: -1,
                  name: "new importance name"
                }
              },
              {
                thing: {id: 4, name: "John Smith"},
                type: {id: 2},
                importance: {id: 20}
              }
            ];
            var differences = this.event.getDifferences(this.newValues);

            differences.editedParticipants.length.should.equal(1);
            differences.editedParticipants[0].thing.id.should.equal(3);
            should.not.exist(differences.editedParticipants[0].thing.name);
            differences.editedParticipants[0].type.id.should.equal(2);
            differences.editedParticipants[0].importance.id.should.equal(-1);
            differences.editedParticipants[0].importance.name.should.equal("new importance name");
          });
          it("should not remove elements from participants", function () {
            var values = {
              start_date: moment(),
              end_date: moment(),
              participants: [{thing: {id: 1234}}]
            };
            this.event.getDifferences(values);
            values.participants.length.should.equal(1);
          });
          it("should not send empty newParticipants", function () {
            var values = {
              start_date: moment(),
              end_date: moment()
            };
            should.not.exist(this.event.getDifferences(values).newParticipants);
          });
          it("should not send empty removedParticipants", function () {
            var values = {
              start_date: moment(),
              end_date: moment(),
              participants: [{thing: {id: 3}}, {thing: {id: 4}}]
            };
            should.not.exist(this.event.getDifferences(values).removedParticipants);
          });
        });
      });

      describe("raw differences", function () {
        it("should return one difference if the name has changed", function () {
          this.event = new Event();
          var differences = this.event.getRawDifferences(
            {name: "old name", start_date: moment(0), end_date: moment(0)},
            {name: "new name", start_date: moment(0), end_date: moment(0)}
          );
          differences.length.should.equal(1);
        });
      });
      describe("update", function () {
        beforeEach(function () {
          this.event = new Event();
          sinon.stub(this.event, "getDifferences", function () {
            return {
              name: "something"
            };
          });
          sinon.stub(this.event, "sendChangeRequest");
        });
        it("should send a reason", function () {
          this.event.update({}, "the reason");
          this.event.sendChangeRequest.getCall(0).args[0].reason.should.equal("the reason");
        });
      });
    });
  }
);