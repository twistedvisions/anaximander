/*global describe, it, before, beforeEach, afterEach */

var sinon = require("sinon");
var should = require("should");
var moment = require("moment");
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
      sinon.spy(this.eventEditor, "ensureParticipant");
      sinon.stub(this.eventEditor, "addParticipant");
      sinon.stub(this.eventEditor, "getEvent", _.bind(function () {
        this.eventEditor.originalEvent = this.originalEvent;
      }, this));

      this.originalEvent = {
        name: "event name",
        type: {
          id: 3
        },
        importance: {
          id: 3
        },
        last_edited: "1999-01-01",
        start_date: new Date(1901, 0, 1),
        end_date: new Date(2001, 0, 1),
        start_offset_seconds: 2 * 60 * 60,
        end_offset_seconds: 2 * 60 * 60,
        place: {
          id: 88
        },
        participants: []
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
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_type_by_id", id: 2}],
        [{db_call: "update_event_type", id: 2}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.eventEditor.ensure.calledWith(sinon.match.any, "event type").should.equal(true);
        this.eventEditor.ensure.args[0][6].should.eql(["add-type"]);
      }, done);
    });
    it("should not ensure event types if one is not passed", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
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
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_importance_by_id", id: 2}],
        [{db_call: "update_event_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.eventEditor.ensure.calledWith(sinon.match.any, "event type importance").should.equal(true);
        this.eventEditor.ensure.args[0][6].should.eql(["add-importance"]);
      }, done);
    });
    it("should not ensure event importances if one is not passed", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.eventEditor.ensure.calledWith(sinon.match.any, "event type importance").should.equal(false);
      }, done);
    });

    it("should still save a nominal importance if it is a new type with a different importance", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        type: {
          id: -1,
          name: "new type"
        },
        importance: {
          id: -1,
          name: "new type",
          description: "new type description",
          value: 5
        }
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"},
          {name: "add-type"}, {name: "add-importance"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "save_creator", id: 101}],
        [{db_call: "save_type"}],
        [{db_call: "save_creator"}],
        [{db_call: "save_importance"}],
        [{db_call: "save_importance"}],
        [{db_call: "update_event_type"}],
        [{db_call: "update_event_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[4][1].should.equal("save_importance");
      }, done);
    });
    it("should not save a type if the user lacks permission", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        type: {
          id: -1,
          name: "new type"
        },
        importance: {
          id: -1,
          name: "new type",
          description: "new type description",
          value: 5
        }
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "save_creator"}],
        [{db_call: "save_type"}],
        [{db_call: "save_creator"}],
        [{db_call: "save_importance"}],
        [{db_call: "update_type_default_importance_when_null"}],
        [{db_call: "update_event_type"}],
        [{db_call: "update_event_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[6][1].should.equal("update_type_default_importance_when_null");
      }, function () {
        done(new Error("shouldn't get here"));
      }, function (ex) {
        should.exist(ex);
        done();
      });
    });
    it("should save a changed name", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("update_event_name");
        this.args[2][2][1].should.equal("new name");
      }, done);
    });
    describe("place", function () {
      it("should ensure places if one exists", function (done) {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          placeId: 2
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "edit-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "find_place_by_id", id: 2}],
          [{db_call: "get_timezone_offset_at_place", offset: 60 * 60}],
          [{db_call: "update_event_place"}],
          [{db_call: "update_event_start_date"}],
          [{db_call: "update_event_end_date"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.args[2][1].should.equal("find_place_by_id");
          this.args[2][2][0].should.equal(2);
        }, done);
      });
      it("should save a changed placeId", function (done) {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          placeId: 2
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "edit-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "find_place_by_id", id: 2}],
          [{db_call: "get_timezone_offset_at_place", offset: 60 * 60}],
          [{db_call: "update_event_place"}],
          [{db_call: "update_event_start_date"}],
          [{db_call: "update_event_end_date"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.args[4][1].should.equal("update_event_place");
          this.args[4][2][1].should.equal(2);
        }, done);
      });
    });
    describe("timezone", function (done) {
      it("should get the timezone if the place has changed", function () {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          placeId: 8
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "edit-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "find_place_by_id", id: 8}],
          [{db_call: "get_timezone_offset_at_place", offset: 60 * 60}],
          [{db_call: "update_event_place"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.args[3][1].should.equal("get_timezone_offset_at_place");
        }, done);
      });
      it("should get the timezone if the start_time has changed", function (done) {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          start_date: new Date(1900, 0, 1)
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "edit-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "get_timezone_offset_at_place", offset: 2 * 60 * 60}],
          [{db_call: "update_event_start_date"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.args[2][1].should.equal("get_timezone_offset_at_place");
        }, done);
      });
      it("should get the timezone if the end_time has changed", function () {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          end_date: new Date(2000, 0, 1)
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "edit-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "get_timezone_offset_at_place", offset: 60 * 60}],
          [{db_call: "update_event_end_date"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.args[2][1].should.equal("get_timezone_offset_at_place");
        }, done);
      });
      it("should not get the timezone if other things have changed", function () {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          link: "adomain.com"
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "edit-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "update_event_link"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.args[2][1].should.not.equal("get_timezone_offset_at_place");
        }, done);
      });
      it("should update the start time and offset if the place has changed and the timezone offset is now different", function (done) {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          placeId: 8
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "edit-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "find_place_by_id", id: 8}],
          [{db_call: "get_timezone_offset_at_place", offset: 3 * 60 * 60}],
          [{db_call: "save_event_updatee"}],
          [{db_call: "update_event_start_date"}],
          [{db_call: "update_event_end_date"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.args[5][1].should.equal("update_event_start_date");
        }, done);
      });
      it("should update the end time and offset if the place has changed and the timezone offset is now different", function (done) {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          placeId: 8
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "edit-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "find_place_by_id", id: 8}],
          [{db_call: "get_timezone_offset_at_place", offset: 3 * 60 * 60}],
          [{db_call: "update_event_place"}],
          [{db_call: "update_event_start_date"}],
          [{db_call: "update_event_end_date"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.args[6][1].should.equal("update_event_end_date");
        }, done);
      });
      it("should not update the start time and offset if the place has changed and the timezone offset is the same", function (done) {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          placeId: 8
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "edit-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "find_place_by_id", id: 8}],
          [{db_call: "get_timezone_offset_at_place", offset: 2 * 60 * 60}],
          [{db_call: "update_event_place"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.args[5][1].should.not.equal("update_event_start_date");
        }, done);
      });
      it("should not update the end time and offset if the place has changed and the timezone offset is the same", function (done) {
        this.fullBody = {
          id: 1,
          last_edited: "2000-01-01",
          placeId: 8
        };

        this.stubValues = [
          [{db_call: "get_user_permissions", name: "edit-event"}],
          [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
          [{db_call: "find_place_by_id", id: 8}],
          [{db_call: "get_timezone_offset_at_place", offset: 2 * 60 * 60}],
          [{db_call: "update_event_place"}],
          [{db_call: "save_event_change"}],
          [{db_call: "update_event_last_edited"}],
          [{db_call: "update_user_last_save_time"}]
        ];

        this.testEdit(function () {
          this.args[6][1].should.not.equal("update_event_end_date");
        }, done);
      });
    });
    it("should save a changed link", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        link: "new link"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_link"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("update_event_link");
        this.args[2][2][1].should.equal("new link");
      }, done);
    });
    it("should save a changed start date at the right timezone offset", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        start_date: new Date(1900, 0, 1)
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "get_timezone_offset_at_place", offset: 2 * 60 * 60}],
        [{db_call: "update_event_start_date"}],
        [{db_call: "save_event_change"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("update_event_start_date");
        this.args[3][2][1].isSame(moment([1900, 0, 1])).should.equal(true);
        this.args[3][2][2].should.equal(2 * 60 * 60);
      }, done);
    });
    it("should save a changed end date at the right timezone offset", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        end_date: new Date(2000, 0, 1)
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "get_timezone_offset_at_place", offset: 2 * 60 * 60}],
        [{db_call: "update_event_end_date"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("update_event_end_date");
        this.args[3][2][1].isSame(moment([2000, 0, 1])).should.equal(true);
        this.args[3][2][2].should.equal(2 * 60 * 60);
      }, done);
    });
    it("should save a changed event type", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        type: {id: 2, related_type_id: 101}
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_type_by_id", id: 2}],
        [{db_call: "update_event_type"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("update_event_type");
        this.args[3][2][1].should.eql(2);
      }, done);
    });
    it("should save a changed event importance", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        importance: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_importance_by_id", id: 2}],
        [{db_call: "update_event_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("update_event_importance");
        this.args[3][2][1].should.eql(2);
      }, done);
    });
    it("should save a changed event importance when the importance is new", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        importance: {
          name: "new importance",
          description: "importance description",
          value: 1
        }
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}, {name: "add-importance"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_importance_by_id", id: 2}],
        [{db_call: "update_event_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_importance");
        //should set the type id
        this.args[3][2][3].should.eql(3);
      }, done);
    });

    it("should not save a changed event importance when the importance is new if the user lacks permission", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        importance: {
          name: "new importance",
          description: "importance description",
          value: 1
        }
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_importance_by_id", id: 2}],
        [{db_call: "update_event_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_importance");
        //should set the type id
        this.args[3][2][3].should.eql(3);
      }, function () {
        done(new Error("should not get here"));
      }, function (ex) {
        should.exist(ex);
        done();
      });
    });

    it("should ensure that new participants exist", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        newParticipants: [{thing: {id: 1}, type: {id: 1, related_type_id: 1}, importance: {id: 1}}]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_role_by_id", id: 1}],
        [{db_call: "find_importance_by_id", id: 1}],
        [{db_call: "find_thing_by_id", id: 1}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.eventEditor.ensureParticipant.calledOnce.should.equal(true);
      }, done);
    });
    it("should add new participants", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        newParticipants: [
          {thing: {id: 1}, type: {id: 1, related_type_id: 1}, importance: {id: 1}}
        ]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_role_by_id", id: 1}],
        [{db_call: "find_importance_by_id", id: 1}],
        [{db_call: "find_thing_by_id", id: 1}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
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
        editedParticipants: [{thing: {id: 2}, type: {}, importance: {}}]
      };

      this.originalEvent = {
        type: {
          id: 3
        },
        participants: [{thing: {id: 2}}]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_thing_by_id"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.eventEditor.ensureParticipant.calledOnce.should.equal(true);
      }, done);
    });

    it("should set the related_type_id of roles if it is a new event type", function (done) {
      this.eventEditor.ensureParticipant.restore();
      sinon.spy(this.eventEditor, "ensureParticipant");
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        type: {
          id: -1,
          name: "new type"
        },
        editedParticipants: [{
          thing: {id: 2},
          type: {id: -1, name: "new role"},
          importance: {id: -1, name: "nominal", value: 5, description: "some description"}
        }]
      };
      this.originalEvent = {
        type: {
          id: 3
        },
        participants: [{thing: {id: 2}}]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}, {name: "add-type"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "save_creator", id: 99}],
        [{db_call: "save_type", id: 100}],
        [{db_call: "update_event_type", id: 1010}],
        [{db_call: "save_role", id: 101}],
        [{db_call: "save_importance", id: 1011}],
        [{db_call: "update_type_default_importance_when_null"}],
        [{db_call: "find_thing_by_id"}],
        [{db_call: "update_participant_role"}],
        [{db_call: "update_participant_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "save_event_change"}],
        [{db_call: "save_event_change"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[5][1].should.equal("save_role");
        this.args[5][2][2].should.equal(100);
      }, done);
    });

    it("should change the role of existing participants", function (done) {
      this.fullBody = {
        id: 126,
        last_edited: "2000-01-01",
        editedParticipants: [{thing: {id: 2}, type: {id: 5, related_type_id: 101}, importance: {id: 6}}]
      };

      this.originalEvent = {
        type: {
          id: 3
        },
        participants: [{thing: {id: 2}, type: {id: 3}, importance: {id: 4}}]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_type_by_id", id: 5}],
        [{db_call: "find_importance_by_id", id: 6}],
        [{db_call: "find_importance_by_id", id: 2}],
        [{db_call: "update_participant_role"}],
        [{db_call: "update_participant_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[5][1].should.equal("update_participant_role");
        this.args[5][2][0].should.equal(126);
      }, done);
    });

    it("should not look for types that are unchanged");

    it("should change the importance of existing participants", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        editedParticipants: [{thing: {id: 2}, type: {id: 4, related_type_id: 101}, importance: {id: 30}}]
      };

      this.originalEvent = {
        type: {
          id: 3
        },
        participants: [{thing: {id: 2}, type: {id: 4}, importance: {id: 30}}]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_type_by_id", id: 4}],
        [{db_call: "find_importance_by_id", id: 30}],
        [{db_call: "find_thing_by_id", id: 4}],
        [{db_call: "update_participant_role"}],
        [{db_call: "update_participant_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[6][1].should.equal("update_participant_importance");
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

        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "remove_participant", id: 2}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("remove_participant");
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
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
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
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
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

    it("should not save unknown keys in the event change", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name",
        funny: "business"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_event_change");
        should.not.exist(JSON.parse(this.args[3][2][4]).funny);
      }, done);
    });

    it("should not save unknown keys in event change newParticipants", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name",
        newParticipants: [{
          thing: {
            id: 1,
            funny: "business"
          },
          type: {
            id: 1,
            related_type_id: 101,
            funny: "business"
          },
          importance: {
            id: 1,
            funny: "business"
          }
        }]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
        [{db_call: "find_type_by_id", id: 1}],
        [{db_call: "find_importance_by_id", id: 1}],
        [{db_call: "find_thing_by_id", id: 1}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[6][1].should.equal("save_event_change");
        should.not.exist(JSON.parse(this.args[6][2][4]).newParticipants[0].thing.funny);
        should.not.exist(JSON.parse(this.args[6][2][4]).newParticipants[0].type.funny);
        should.not.exist(JSON.parse(this.args[6][2][4]).newParticipants[0].importance.funny);
      }, done);
    });

    it("should only save the changed key in the old value in the event change", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_event_change");
        should.not.exist(JSON.parse(this.args[3][2][3]).type);
        should.exist(JSON.parse(this.args[3][2][3]).name);
      }, done);
    });

    it("should save the participants in the old values if they have changed", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name",
        newParticipants: [{
          thing: {
            id: 1
          },
          type: {
            id: 1,
            related_type_id: 101
          },
          importance: {
            id: 1
          }
        }]
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_event_name"}],
        [{db_call: "find_type_by_id", id: 1}],
        [{db_call: "find_importance_by_id", id: 1}],
        [{db_call: "find_thing_by_id"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[6][1].should.equal("save_event_change");
        should.exist(JSON.parse(this.args[6][2][3]).participants);
      }, done);
    });

    it("should save the type_id in the old values if it has changed", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        type: {id: 2, related_type_id: 101}
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_type_by_id", id: 2}],
        [{db_call: "update_event_type"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[4][1].should.equal("save_event_change");
        JSON.parse(this.args[4][2][3]).type_id.should.equal(3);
        JSON.parse(this.args[4][2][4]).type_id.should.equal(2);
      }, done);
    });

    it("should save the importance_id in the old values if it has changed", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        importance: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-event"}],
        [{db_call: "get_event_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_importance_by_id", id: 2}],
        [{db_call: "update_event_importance"}],
        [{db_call: "save_event_change"}],
        [{db_call: "update_event_last_edited"}],
        [{db_call: "update_user_last_save_time"}]
      ];

      this.testEdit(function () {
        this.args[4][1].should.equal("save_event_change");
        JSON.parse(this.args[4][2][3]).importance_id.should.equal(3);
        JSON.parse(this.args[4][2][4]).importance_id.should.equal(2);
      }, done);
    });

  });
});
