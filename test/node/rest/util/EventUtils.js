/*global describe, it, beforeEach, afterEach */

var should = require("should");
var _ = require("underscore");

var tryTest = require("../../tryTest");
var stubDb = require("../../stubDb");

var EventUtils = require("../../../../lib/rest/util/EventUtils");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("EventUtils", function () {

  beforeEach(function () {
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore(this);
  });

  describe("ensure", function () {
    beforeEach(function () {
      this.fnArgs = [
        {},
        "ensureThing",
        "find_some_thing_by_id",
        [],
        "save_some_thing_by_id",
        []
      ];
      this.eventSaver = new EventUtils();
    });
    it("should try to find an ensured-thing if it has an id", function (done) {
      var self = this;
      this.fnArgs[0].id = 3;
      this.eventSaver.ensure.apply(this.eventSaver, this.fnArgs).then(
        tryTest(function () {
          self.args[0][1].should.equal("find_some_thing_by_id");
        }, done),
        done
      );
      this.d[0].resolve({rows: [{id: 1}]});
    });

    it("throw an exception if it can't find an ensured-thing", function (done) {
      this.fnArgs[0].id = 4;
      this.eventSaver.ensure.apply(this.eventSaver, this.fnArgs).then(
        function () {
          done({message: "should not succeed"});
        },
        tryTest(function (e) {
          should.exist(e);
        }, done)
      );
      this.d[0].resolve({rows: []});
    });

    it("should try to create an ensured-thing if it doesn't exist with a creator", function (done) {
      var self = this;
      this.fnArgs[0].name = "somewhere";
      this.eventSaver.ensure.apply(this.eventSaver, this.fnArgs).then(
        tryTest(function () {
          self.args[0][1].should.equal("save_creator");
          self.args[1][1].should.equal("save_some_thing_by_id");
        }, done
      ), done);
      stubDb.setQueryValues(this, [
        [{id: 1}],
        [{id: 2}]
      ]);
    });

    it("should return the ensured-thing's id if it was created", function (done) {
      this.fnArgs[0].name = "somewhere";
      this.eventSaver.ensure.apply(this.eventSaver, this.fnArgs).then(
        tryTest(function (id) {
          id.should.be.above(0);
        }, done),
        done
      );
      stubDb.setQueryValues(this, [
        [{id: 1}],
        [{id: 2}]
      ]);
    });
    it("should throw an exception if an ensured-thing cannot be created", function (done) {
      this.fnArgs[0].name = "somewhere";
      this.eventSaver.ensure.apply(this.eventSaver, this.fnArgs).then(
        function () {
          done({message: "should not succeed"});
        },
        tryTest(function (e) {
          should.exist(e);
        }, done)
      );
      stubDb.setQueryValues(this, [
        [{id: 1}],
        []
      ]);
    });
    it("should throw an exception if an creator cannot be created", function (done) {
      this.fnArgs[0].name = "somewhere";
      this.eventSaver.ensure.apply(this.eventSaver, this.fnArgs).then(
        function () {
          done({message: "should not succeed"});
        },
        tryTest(function (e) {
          should.exist(e);
        }, done)
      );
      this.d[0].resolve({rows: []});
    });

    describe("addAttendees", function () {
      it("should add each attendee to the event", function (done) {
        var self = this;
        new EventUtils().addParticipants([
            {thing: {id: 3}, type: {id: 4}, importance: {id: 5}},
            {thing: {id: 6}, type: {id: 7}, importance: {id: 8}}
          ], 9).then(
          tryTest(function () {
            self.args[0][1].should.equal("save_event_participant");
            self.args[1][1].should.equal("save_event_participant");
          }, done),
          function (e) {
            done(e);
          }
        );
        _.defer(function () {
          self.d[0].resolve({rows: [{id: 1}]});
          self.d[1].resolve({rows: [{}]});
        });
      });
    });
  });
});
