/*global describe, it, before, beforeEach, afterEach */

var sinon = require("sinon");
var should = require("should");
var _ = require("underscore");

var tryTest = require("../tryTest");
var stubDb = require("../stubDb");

var saveEvent = require("../../../lib/rest/saveEvent");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("saveEvent", function () {
  before(function () {
    this.testSave = function (fn, done, failureFn) {
      var req = {
        user: {id: 1, last_save_time: new Date(0)},
        body: this.fullBody,
        isAuthenticated: function () {
          return true;
        }
      };
      var res = {
        send: function () {}
      };
      var next = function (e) {
        return failureFn ? failureFn(e) : null;
      };
      this.eventSaver.call(req, res, next).then(tryTest(_.bind(fn, this), done));
      stubDb.setQueryValues(this, this.stubValues);
    };
  });
  beforeEach(function () {
    this.eventSaver = new saveEvent.EventSaver();
    this.fullBody = {
      name: "a test",
      link: "http://testlink.com",
      start_date: "2013-03-12T00:00:00.000Z",
      end_date: "2013-03-12T23:59:00.000Z",
      type: {
        id: 1,
        name: "test type"
      },
      importance: {
        id: 1,
        name: "test importance"
      },
      place: {
        id: 123,
        name: "Sneem"
      },
      participants: [{
        thing: {
          id: 456,
          name: "Kareem Ajani (Person)",
          typeId: 4
        },
        type: {
          id: 1
        },
        importance: {
          id: 1
        }
      }]
    };
    this.stubValues = [
      [{id: 1, name: "add-event"}],
      [{id: 2}],
      [{id: 3}],
      [{id: 4}],
      [{id: 5}],
      [{id: 6}],
      [{id: 7}],
      [{id: 8}],
      [{id: 9}],
      [{id: 10}],
      [{id: 11}],
      [{id: 12}]
    ];
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore(this);
    this.eventSaver = null;
  });
  describe("component functions", function () {

    describe("dependent objects", function () {
      beforeEach(function () {
        sinon.spy(this.eventSaver, "ensure");
      });
      afterEach(function () {
        this.eventSaver.ensure.restore();
      });
      describe("event objects", function () {
        it("should ensure the event type", function (done) {
          this.testSave(function () {
            this.eventSaver.ensure.calledWith(sinon.match.any, "event type").should.equal(true);
          }, done);
        });
        it("should ensure the event importance", function (done) {
          this.testSave(function () {
            this.eventSaver.ensure.calledWith(sinon.match.any, "event type importance").should.equal(true);
          }, done);
        });
        it("should fail if the user lacks the add-event permission", function (done) {
          this.stubValues[0].pop();
          this.testSave(function () {
            throw new Error("should not get here");
          }, done, function (err) {
            should.exist(err);
            done();
          });
        });
        it("should save the default importance if it is a new type", function (done) {
          this.fullBody.type.id = -1;
          this.stubValues[0].push({name: "add-type"});
          this.stubValues.push([{id: 11}]);
          this.testSave(function () {
            this.args[4][1].should.equal("update_type_default_importance_when_null");
          }, done);
        });
        it("should not save the default importance if it is a new type and lacks permission", function (done) {
          this.fullBody.type.id = -1;
          this.stubValues.push([{id: 11}]);
          this.testSave(function () {
            this.args[4][1].should.equal("update_type_default_importance_when_null");
          }, function () {
            done(new Error("shouldn't get here"));
          }, function (ex) {
            should.exist(ex);
            done();
          });
        });
      });
      describe("place", function () {
        it("should ensure the place's thing", function (done) {
          this.testSave(function () {
            this.eventSaver.ensure.calledWith(sinon.match.any, "place").should.equal(true);
          }, done);
        });
        it("should create a place if the thing doesn't exist", function (done) {
          this.eventSaver.permissions = {"add-thing": {}};
          this.eventSaver.ensurePlace({
            id: -1,
            name: "place name"
          }).then(_.bind(function () {
            this.args[2][1].should.equal("save_place");
            done();
          }, this));
          stubDb.setQueryValues(this, this.stubValues);
        });
        it("should not create a place if the thing doesn't exist if it lacks permission", function (done) {
          this.eventSaver.permissions = {};
          this.eventSaver.ensurePlace({
            id: -1,
            name: "place name"
          }).then(
            function () {
              done(new Error("should not get here"));
            },
            function (ex) {
              should.exist(ex);
              done();
            }
          );
          stubDb.setQueryValues(this, this.stubValues);
        });
        it("should update the start time by the offset at the place", function (done) {
          this.fullBody.placeId = 1;
          this.stubValues[7] = [{offset: 60 * 60}];
          this.testSave(_.bind(function () {
            this.fullBody.start_date.toISOString().should.equal("2013-03-11T23:00:00.000Z");
          }, this), done);
        });
        it("should update the end time by the offset at the place", function (done) {
          this.fullBody.placeId = 1;
          this.stubValues[7] = [{offset: 60 * 60}];
          this.testSave(_.bind(function () {
            this.fullBody.end_date.toISOString().should.equal("2013-03-12T22:59:00.000Z");
          }, this), done);
        });
        it("should save the offset at the place", function (done) {
          this.fullBody.placeId = 1;
          this.stubValues[7] = [{offset: 60 * 60}];
          this.testSave(_.bind(function () {
            this.fullBody.end_offset_seconds.should.equal(3600);
            this.fullBody.start_offset_seconds.should.equal(3600);
          }, this), done);
        });
      });
      describe("participants", function () {
        it("should ensure that each participant's type exists", function (done) {
          this.testSave(function () {
            this.eventSaver.ensure.calledWith(sinon.match.any, "participant type").should.equal(true);
          }, done);
        });
        it("should use the event's typeId for the related_event_id when it is a new event type", function (done) {
          this.fullBody.type.id = -1;
          this.fullBody.participants[0].type.id = -1;
          this.fullBody.participants[0].type.name = "new role";
          this.fullBody.participants[0].type.related_type_id = -1;
          this.stubValues[0].push({name: "add-type"});
          this.stubValues.push([{id: 20}]);
          this.stubValues.push([{id: 21}]);
          this.testSave(function () {
            this.args[6][1].should.equal("save_role");
            this.args[6][2][2].should.equal(3);
          }, done);
        });
        it("should ensure that each participant's importance exists", function (done) {
          this.testSave(function () {
            this.eventSaver.ensure.calledWith(sinon.match.any, "participant importance").should.equal(true);
          }, done);
        });
        describe("things with an id", function () {
          it("should ensure that each participant's things exist", function (done) {
            this.testSave(function () {
              this.eventSaver.ensure.calledWith(sinon.match.any, "participant thing").should.equal(true);
            }, done);
          });
        });
        describe("new things", function () {
          beforeEach(function () {
            var thing = this.fullBody.participants[0].thing;
            thing.id = -1;
            thing.subtypes = [{
              type: {id: 1},
              importance: {id: 1}
            }];
            this.stubValues[0].push({name: "add-thing"});
            this.stubValues.push([{id: 9}]);
            this.stubValues.push([{id: 10}]);
            this.stubValues.push([{id: 11}]);
          });
          it("should throw an exception if the participant's thing's type does not exist", function (done) {
            delete this.fullBody.participants[0].thing.typeId;
            this.testSave(
              function () {
                throw new Error("should not get here");
              },
              done,
              tryTest(_.bind(function () {
                this.eventSaver.ensure.calledWith(sinon.match.any, "participant thing").should.equal(false);
              }, this), done)
            );
          });
          it("should ensure that each participant's thing's subtype exists", function (done) {
            this.testSave(function () {
              this.eventSaver.ensure.calledWith(sinon.match.any, "participant thing subtype type").should.equal(true);
            }, done);
          });
          it("should ensure that each participant's thing's subtype's importance exists", function (done) {
            this.testSave(function () {
              this.eventSaver.ensure.calledWith(sinon.match.any, "participant thing subtype importance").should.equal(true);
            }, done);
          });
          it("should create a new thing", function (done) {
            this.testSave(function () {
              this.eventSaver.ensure.calledWith(sinon.match.any, "participant thing").should.equal(true);
            }, done);
          });
          it("should add subtypes to the new thing", function (done) {
            this.testSave(function () {
              this.args[10][1].should.equal("save_thing_subtype");
            }, done);
          });
          it("should not create things without permission", function (done) {
            this.stubValues[0].pop();
            this.testSave(function () {
              this.eventSaver.ensure.calledWith(sinon.match.any, "participant thing").should.equal(true);
            }, function () {
              done(new Error("should not get here"));
            }, function (ex) {
              should.exist(ex);
              done();
            });
          });
        });
      });
    });

    describe("createEvent", function () {
      it("should create event if all the necessary values exist", function (done) {
        new saveEvent.EventSaver().createEvent({
            name: "something happened",
            type_id: 2,
            place_id: 1,
            start_date: "2013-06-02",
            end_date: "2013-06-02",
            link: "http://some.wiki.page/ihope.html"
          }
        ).then(
          tryTest(function (id) {
            id.should.be.above(0);
          }, done),
          function (e) {
            done(e);
          }
        );
        stubDb.setQueryValues(this, [
          [{id: 1}],
          [{id: 2}]
        ]);
      });
      it("should ensure a creator", function (done) {
        new saveEvent.EventSaver().createEvent({
            name: "something happened",
            type_id: 2,
            place_id: 1,
            start_date: "2013-06-02",
            end_date: "2013-06-02",
            link: "http://some.wiki.page/ihope.html"
          }
        ).then(
          tryTest(_.bind(function () {
            this.args[0][1].should.equal("save_creator");
          }, this), done),
          function (e) {
            done(e);
          }
        );
        stubDb.setQueryValues(this, [
          [{id: 1}],
          [{id: 2}]
        ]);
      });

      ["name", "place_id", "type_id", "start_date", "end_date"].forEach(function (key) {
        it("should throw an exception if " + key + " cannot be found", function (done) {
          var obj = {
            name: "something happened",
            type_id: 1,
            place_id: 1,
            start_date: "2013-06-02",
            end_date: "2013-06-02",
            link: "http://some.wiki.page/ihope.html"
          };
          delete obj[key];
          new saveEvent.EventSaver().createEvent(obj).then(
            function () {
              done({message: "should not succeed"});
            },
            tryTest(function (e) {
              should.exist(e);
            }, done)
          );
        });
      });
      it("should throw an exception if the end date is before the start date", function (done) {
        new saveEvent.EventSaver().createEvent({
          name: "something happened",
          type_id: 1,
          place_id: 1,
          start_date: "2013-06-02",
          end_date: "2013-06-01",
          link: "http://some.wiki.page/ihope.html"
        }).then(
          function () {
            done({message: "should not succeed"});
          },
          tryTest(function (e) {
            should.exist(e);
          }, done)
        );
      });
      it("should throw an exception if it cannot create the event", function (done) {
        new saveEvent.EventSaver().createEvent({
            name: "something happened",
            type_id: 1,
            place_id: 2,
            start_date: "2013-06-02",
            end_date: "2013-06-02",
            link: "http://some.wiki.page/ihope.html"
          }
        ).then(
          function () {
            done({message: "should not succeed"});
          },
          tryTest(function (e) {
            should.exist(e);
          }, done)
        );

        stubDb.setQueryValues(this, [[]]);
      });
      it("should adjust the start date, by the timezone offset at the place", function (done) {
        new saveEvent.EventSaver().createEvent({
            name: "something happened",
            type_id: 2,
            place_id: 1,
            start_date: "2013-06-02 00:00:00",
            end_date: "2013-06-02 00:00:00",
            start_offset_seconds: 3600,
            end_offset_seconds: -3600,
            link: "http://some.wiki.page/ihope.html"
          }
        ).then(
          tryTest(_.bind(function () {
            this.args[0][1].should.equal("save_creator");
            this.args[1][2][5].should.eql(new Date(2013, 5, 2, 1));
          }, this), done),
          function (e) {
            done(e);
          }
        );
        stubDb.setQueryValues(this, [
          [{id: 1}],
          [{id: 2}]
        ]);
      });
      it("should adjust the end date, by the timezone offset at the place", function (done) {
        new saveEvent.EventSaver().createEvent({
            name: "something happened",
            type_id: 2,
            place_id: 1,
            start_date: "2013-06-02 00:00:00",
            end_date: "2013-06-02 00:00:00",
            start_offset_seconds: 3600,
            end_offset_seconds: -3600,
            link: "http://some.wiki.page/ihope.html"
          }
        ).then(
          tryTest(_.bind(function () {
            this.args[0][1].should.equal("save_creator");
            this.args[1][2][6].should.eql(new Date(2013, 5, 1, 23));
          }, this), done),
          function (e) {
            done(e);
          }
        );
        stubDb.setQueryValues(this, [
          [{id: 1}],
          [{id: 2}]
        ]);
      });
    });
  });

  describe("transaction", function () {
    it("should do the entire save in a transaction", function (done) {
      this.testSave(function () {
        this.db.startTransaction.callCount.should.equal(1);
        this.db.endTransaction.callCount.should.equal(1);
      }, done);
    });
    it("should roll back the transaction if a component section fails", function (done) {
      var req = {
        user: {id: 1, last_save_time: new Date(0)},
        body: {
          name: "a test",
          start_date: "2013-03-12T00:00:00.000Z",
          end_date: "2013-03-12T00:00:00.000Z",
          place: {
            id: 58365,
            name: "Sneem"
          },
          type: {
            id: 2,
            name: "some type"
          },
          attendees: [{
            id: -1
          }]
        },
        isAuthenticated: function () {
          return true;
        }
      };
      var res = {
        send: function () {}
      };

      new saveEvent.EventSaver().call(req, res).then(
        function () {
          done({message: "shouldn't get here"});
        },
        tryTest(_.bind(function () {
          this.db.startTransaction.callCount.should.equal(1);
          this.db.endTransaction.callCount.should.equal(0);
          this.db.rollbackTransaction.callCount.should.equal(1);
        }, this), done)
      );

      stubDb.setQueryValues(this, [
        [{id: 1}],
        [{id: 2}],
        [{id: 3}],
        [{id: 4}]
      ]);

    });
  });
});
