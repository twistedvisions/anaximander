/*global describe, it, before, beforeEach, afterEach */

var sinon = require("sinon");
var should = require("should");
var _ = require("underscore");

var tryTest = require("../tryTest");
var stubDb = require("../stubDb");

var deleteEvent = require("../../../lib/rest/deleteEvent");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("deleteEvent", function () {
  before(function () {
    this.testEdit = function (fn, done, failureFn) {
      var req = {
        user: {id: 101, last_save_time: new Date(0)},
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
      this.eventDeleter.call(req, res, next).then(tryTest(_.bind(fn, this), done));
      stubDb.setQueryValues(this, this.stubValues);
    };
  });
  beforeEach(function () {
    this.eventDeleter = new deleteEvent.EventDeleter();
    stubDb.setup(this);

  });
  afterEach(function () {
    stubDb.restore(this);
    this.eventDeleter = null;
  });
  describe("component functions", function () {
    beforeEach(function () {
      this.stubValues = [];
      sinon.stub(this.eventDeleter, "getEvent", _.bind(function () {
        this.eventDeleter.originalEvent = this.originalEvent;
      }, this));

      this.originalEvent = {
        name: "event name",
        last_edited: "1999-01-01",
        creator_user_id: 101
      };
    });
    afterEach(function () {
      this.eventDeleter.getEvent.restore();
      this.originalEvent = null;
    });
    it("should throw an error if no id is passed", function (done) {
      this.fullBody = {};

      this.testEdit(function () {}, null, function (e) {
        should.exist(e);
        done();
      });
    });

    it("should fail if no last_edited time is passed", function (done) {
      this.fullBody = {
        id: 1,
        type: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}]
      ];

      this.testEdit(function () {
        throw new Error("should not get here");
      }, done, function () {
        done();
      });
    });
    it("should fail if the last_edited is different", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        type: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-02"}]
      ];

      this.testEdit(function () {
        throw new Error("should not get here");
      }, done, function () {
        done();
      });
    });

    describe("permission", function () {
      it("should getEvent if you have delete-event permission", function (done) {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          name: "new name"
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "delete-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "delete_event"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.eventDeleter.getEvent.calledOnce.should.equal(true);
        }, done);
      });
      it("should getEvent if you have delete-own-event permission", function (done) {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          name: "new name"
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "delete-own-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "delete_event"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.eventDeleter.getEvent.calledOnce.should.equal(true);
        }, done);
      });
      it("should not getEvent if you have neither permission", function (done) {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          name: "new name"
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "edit-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "delete_event"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          throw new Error("should not get here");
        }, done, function (e) {
          should.exist(e);
          done();
        });
      });

      it("should fail if you have delete-own-event permission and it isn't your event", function (done) {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          name: "new name"
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "delete-own-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "delete_event"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.args[2][1].should.equal("delete_event");
        }, done);
      });
    });


    it("should call save_change after a change has happened", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "delete-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "delete_event"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_event_change");
      }, done);
    });

    it("should not save the last_edited time in the event change", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "delete-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "delete_event"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_event_change");
        should.not.exist(JSON.parse(this.args[3][2][3]).last_edited);
        should.not.exist(JSON.parse(this.args[3][2][4]).last_edited);

      }, done);
    });

  });
});
