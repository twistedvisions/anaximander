/*global describe, it, before, beforeEach, afterEach */

var sinon = require("sinon");
var should = require("should");
var _ = require("underscore");

var tryTest = require("../tryTest");
var stubDb = require("../stubDb");

var editEvent = require("../../../lib/rest/editEvent");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("editEvent", function () {
  before(function () {
    this.testEdit = function (fn, done, failureFn) {
      var req = {
        user: {id: 1},
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
      this.eventEditor.call(req, res, next).then(tryTest(_.bind(fn, this), done));
      stubDb.setQueryValues(this, this.stubValues);
    };
  });
  beforeEach(function () {
    this.eventEditor = new editEvent.EventEditor();
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore(this);
    this.eventEditor = null;
  });
  describe("component functions", function () {
    beforeEach(function () {
      this.stubValues = [];
      sinon.spy(this.eventEditor, "ensure");
      sinon.stub(this.eventEditor, "ensureParticipant");
      sinon.stub(this.eventEditor, "addParticipant");
      sinon.stub(this.eventEditor, "getEvent", _.bind(function () {
        this.eventEditor.originalEvent = this.originalEvent;
      }, this));

      this.originalEvent = {
        type: {
          id: 3
        }
      };
    });
    afterEach(function () {
      this.eventEditor.ensure.restore();
      this.eventEditor.ensureParticipant.restore();
      this.eventEditor.addParticipant.restore();
      this.eventEditor.getEvent.restore();
      this.originalEvent = null;
    });
    it("should throw an error if no id is passed", function (done) {
      this.fullBody = {};

      this.testEdit(function () {}, null, function (e) {
        should.exist(e);
        done();
      });
    });
    it("should throw an error if nothing is passed to change", function (done) {
      this.fullBody = {
        id: 1
      };

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
    // it("should fail if the row is already locked - how to test this?");
    it("should ensure event types if one is passed", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        type: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_type_by_id", id: 2}],
        [{db_call: "update_event_type", id: 2}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.eventEditor.ensure.calledWith(sinon.match.any, "event type").should.equal(true);
      }, done);
    });
    it("should not ensure event types if one is not passed", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];
      this.testEdit(function () {
        this.eventEditor.ensure.calledWith(sinon.match.any, "event type").should.equal(false);
        should.not.exist(this.eventEditor.params.typeId);
      }, done);
    });
    it("should ensure event importances if one is passed", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        importance: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_importance_by_id", id: 2}],
        [{db_call: "update_event_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.eventEditor.ensure.calledWith(sinon.match.any, "event type importance").should.equal(true);
      }, done);
    });
    it("should not ensure event importances if one is not passed", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.eventEditor.ensure.calledWith(sinon.match.any, "event type importance").should.equal(false);
      }, done);
    });
    it("should save a changed name", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.args[1][1].should.equal("update_event_name");
        this.args[1][2][1].should.equal("new name");
      }, done);
    });
    it("should save a changed link", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        link: "new link"
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_link"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.args[1][1].should.equal("update_event_link");
        this.args[1][2][1].should.equal("new link");
      }, done);
    });
    it("should save a changed start date", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        start_date: new Date(1900, 0, 1)
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_start_date"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.args[1][1].should.equal("update_event_start_date");
        this.args[1][2][1].should.eql(new Date(1900, 0, 1));
      }, done);
    });
    it("should save a changed end date", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        end_date: new Date(2000, 0, 1)
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_end_date"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.args[1][1].should.equal("update_event_end_date");
        this.args[1][2][1].should.eql(new Date(2000, 0, 1));
      }, done);
    });
    it("should save a changed event type", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        type: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_type_by_id", id: 2}],
        [{db_call: "update_event_type"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("update_event_type");
        this.args[2][2][1].should.eql(2);
      }, done);
    });
    it("should save a changed event importance", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        importance: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_importance_by_id", id: 2}],
        [{db_call: "update_event_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("update_event_importance");
        this.args[2][2][1].should.eql(2);
      }, done);
    });

    it("should ensure that new participants exist", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        newParticipants: [{}]
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.eventEditor.ensureParticipant.calledOnce.should.equal(true);
      }, done);
    });
    it("should add new participants", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        newParticipants: [{}]
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.eventEditor.addParticipant.calledOnce.should.equal(true);
      }, done);
    });

    it("should not change participants that are not part of the event", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        editedParticipants: [{thing: {id: 1}}]
      };

      this.originalEvent = {
        type: {
          id: 3
        },
        participants: []
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

    it("should ensure that changed participants' values exist", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        editedParticipants: [{thing: {id: 2}}]
      };

      this.originalEvent = {
        type: {
          id: 3
        },
        participants: [{thing: {id: 2}}]
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.eventEditor.ensureParticipant.calledOnce.should.equal(true);
      }, done);
    });

    it("should change the role of existing participants", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        editedParticipants: [{thing: {id: 2}, type: {id: 3}}]
      };

      this.originalEvent = {
        type: {
          id: 3
        },
        participants: [{thing: {id: 2}}]
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_participant_role", id: 2}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.args[1][1].should.equal("update_participant_role");
      }, done);
    });
    it("should change the importance of existing participants", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        editedParticipants: [{thing: {id: 2}, importance: {id: 3}}]
      };

      this.originalEvent = {
        type: {
          id: 3
        },
        participants: [{thing: {id: 2}}]
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_participant_importance", id: 2}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.args[1][1].should.equal("update_participant_importance");
      }, done);
    });

    it("should remove exisiting participants", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        removedParticipants: [1]
      };

      this.originalEvent = {
        type: {
          id: 3
        },
        participants: [
          {thing: {id: 1}}
        ]
      };

      this.stubValues = [

        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "remove_participant", id: 2}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.args[1][1].should.equal("remove_participant");
      }, done);
    });

    it("should not remove participants that do not exist", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        removedParticipants: [1]
      };

      this.originalEvent = {
        type: {
          id: 3
        },
        participants: []
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

    it("should call save_change after a change has happened", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("save_event_change");
      }, done);
    });

  });
});
