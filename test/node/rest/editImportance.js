/*global describe, it, before, beforeEach, afterEach */

var sinon = require("sinon");
var should = require("should");
var _ = require("underscore");

var tryTest = require("../tryTest");
var stubDb = require("../stubDb");

var editImportance = require("../../../lib/rest/editImportance");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("editImportance", function () {
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
        send: _.bind(function (result) {
          this.result = result;
        }, this)
      };
      var next = function (e) {
        return failureFn ? failureFn(e) : null;
      };
      this.importanceEditor.call(req, res, next).then(tryTest(_.bind(fn, this), done));
      stubDb.setQueryValues(this, this.stubValues);
    };
  });
  beforeEach(function () {
    this.importanceEditor = new editImportance.ImportanceEditor();
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore(this);
    this.importanceEditor = null;
  });
  describe("component functions", function () {
    beforeEach(function () {
      this.stubValues = [];
      sinon.spy(this.importanceEditor, "ensure");
      sinon.stub(this.importanceEditor, "getImportance", _.bind(function () {
        this.importanceEditor.originalImportance = this.originalImportance;
      }, this));

      this.originalImportance = {
        name: "importance name",
        default_importance_id: 1,
        last_edited: "1999-01-01"
      };
    });
    afterEach(function () {
      this.importanceEditor.ensure.restore();
      this.importanceEditor.getImportance.restore();
      this.originalImportance = null;
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
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_importance_lock", last_edited: "2000-01-01"}]
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
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_importance_lock", last_edited: "2000-01-02"}]
      ];

      this.testEdit(function () {
        throw new Error("should not get here");
      }, done, function () {
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
        [{db_call: "get_user_permissions", name: "edit-importance"}],
        [{db_call: "get_importance_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_importance_name"}],
        [{db_call: "save_importance_change"}],
        [{db_call: "update_importance_last_edited"}],
        [{db_call: "find_importance_by_id"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("update_importance_name");
        this.args[2][2][1].should.equal("new name");
      }, done);
    });

    it("should save a changed description", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        description: "new description"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-importance"}],
        [{db_call: "get_importance_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_importance_description"}],
        [{db_call: "save_importance_change"}],
        [{db_call: "update_importance_last_edited"}],
        [{db_call: "find_importance_by_id"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("update_importance_description");
        this.args[2][2][1].should.equal("new description");
      }, done);
    });

    it("should save a changed value", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        value: 8
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-importance"}],
        [{db_call: "get_importance_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_importance_value"}],
        [{db_call: "save_importance_change"}],
        [{db_call: "update_importance_last_edited"}],
        [{db_call: "find_importance_by_id"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("update_importance_value");
        this.args[2][2][1].should.equal(8);
      }, done);
    });

    it("should call save_change after a change has happened", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-importance"}],
        [{db_call: "get_importance_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_importance_name"}],
        [{db_call: "save_importance_change"}],
        [{db_call: "update_importance_last_edited"}],
        [{db_call: "find_importance_by_id"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_importance_change");
      }, done);
    });

    it("should not save the last_edited time in the importance change", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-importance"}],
        [{db_call: "get_importance_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_importance_name"}],
        [{db_call: "save_importance_change"}],
        [{db_call: "update_importance_last_edited"}],
        [{db_call: "find_importance_by_id"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_importance_change");
        should.not.exist(JSON.parse(this.args[3][2][3]).last_edited);
        should.not.exist(JSON.parse(this.args[3][2][4]).last_edited);

      }, done);
    });

    it("should not save unknown keys in the importance change", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name",
        funny: "business"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-importance"}],
        [{db_call: "get_importance_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_importance_name"}],
        [{db_call: "save_importance_change"}],
        [{db_call: "update_importance_last_edited"}],
        [{db_call: "find_importance_by_id"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_importance_change");
        should.not.exist(JSON.parse(this.args[3][2][4]).funny);
      }, done);
    });

    it("should save the name in lower case", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "New Name",
        funny: "business"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-importance"}],
        [{db_call: "get_importance_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_importance_name"}],
        [{db_call: "save_importance_change"}],
        [{db_call: "update_importance_last_edited"}],
        [{db_call: "find_importance_by_id"}]
      ];

      this.testEdit(function () {
        this.args[3][1].should.equal("save_importance_change");
        JSON.parse(this.args[3][2][4]).name.should.equal("new name");
      }, done);
    });

    it("should return the new importance", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name",
        funny: "business"
      };

      this.stubValues = [
        [{db_call: "get_user_permissions", name: "edit-importance"}],
        [{db_call: "get_importance_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_importance_name"}],
        [{db_call: "save_importance_change"}],
        [{db_call: "update_importance_last_edited"}],
        [{db_call: "find_importance_by_id", last_edited: "2014-01-01"}]
      ];

      this.testEdit(function () {
        this.result.last_edited.should.equal("2014-01-01");
      }, done);
    });

  });
});
