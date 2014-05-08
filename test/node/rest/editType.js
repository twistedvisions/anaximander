/*global describe, it, before, beforeEach, afterEach */

var sinon = require("sinon");
var should = require("should");
var _ = require("underscore");

var tryTest = require("../tryTest");
var stubDb = require("../stubDb");

var editType = require("../../../lib/rest/editType");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("editType", function () {
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
      this.typeEditor.call(req, res, next).then(tryTest(_.bind(fn, this), done));
      stubDb.setQueryValues(this, this.stubValues);
    };
  });
  beforeEach(function () {
    this.typeEditor = new editType.TypeEditor();
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore(this);
    this.typeEditor = null;
  });
  describe("component functions", function () {
    beforeEach(function () {
      this.stubValues = [];
      sinon.spy(this.typeEditor, "ensure");
      sinon.stub(this.typeEditor, "getType", _.bind(function () {
        this.typeEditor.originalType = this.originalType;
      }, this));

      this.originalType = {
        name: "type name",
        default_importance_id: 1,
        last_edited: "1999-01-01"
      };
    });
    afterEach(function () {
      this.typeEditor.ensure.restore();
      this.typeEditor.getType.restore();
      this.originalType = null;
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
    //todo: this should live on the class editType extends
    it("should fail if no last_edited time is passed", function (done) {
      this.fullBody = {
        id: 1,
        type: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_type_lock", last_edited: "2000-01-01"}]
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
        [{db_call: "get_type_lock", last_edited: "2000-01-02"}]
      ];

      this.testEdit(function () {
        throw new Error("should not get here");
      }, done, function () {
        done();
      });
    });
    it("should ensure the default importance if it is passed", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        defaultImportance: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_type_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_importance_by_id", id: 2}],
        [{db_call: "update_default_importance_id", id: 2}],
        [{db_call: "save_type_change"}],
        [{db_call: "update_type_last_edited"}],
        [{db_call: "find_type_by_id"}]
      ];

      this.testEdit(function () {
        this.typeEditor.ensure.calledWith(sinon.match.any, "type importance").should.equal(true);
      }, done);
    });

    it("should save a changed name", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_type_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_type_name"}],
        [{db_call: "save_type_change"}],
        [{db_call: "update_type_last_edited"}],
        [{db_call: "find_type_by_id"}]
      ];

      this.testEdit(function () {
        this.args[1][1].should.equal("update_type_name");
        this.args[1][2][1].should.equal("new name");
      }, done);
    });

    it("should save a changed default importance", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        defaultImportance: {id: 2}
      };

      this.stubValues = [
        [{db_call: "get_type_lock", last_edited: "2000-01-01"}],
        [{db_call: "find_importance_by_id", id: 2}],
        [{db_call: "update_default_importance_id"}],
        [{db_call: "save_type_change"}],
        [{db_call: "update_type_last_edited"}],
        [{db_call: "find_type_by_id"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("update_default_importance_id");
        this.args[2][2][1].should.equal(2);
      }, done);
    });

    it("should call save_change after a change has happened", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_type_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_type_name"}],
        [{db_call: "save_type_change"}],
        [{db_call: "update_type_last_edited"}],
        [{db_call: "find_type_by_id"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("save_type_change");
      }, done);
    });

    it("should save the name in lower case", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "New Name"
      };

      this.stubValues = [
        [{db_call: "get_type_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_type_name"}],
        [{db_call: "save_type_change"}],
        [{db_call: "update_type_last_edited"}],
        [{db_call: "find_type_by_id"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("save_type_change");
        JSON.parse(this.args[2][2][4]).name.should.equal("new name");
      }, done);
    });

    it("should not save the last_edited time in the type change", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name"
      };

      this.stubValues = [
        [{db_call: "get_type_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_type_name"}],
        [{db_call: "save_type_change"}],
        [{db_call: "update_type_last_edited"}],
        [{db_call: "find_type_by_id"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("save_type_change");
        should.not.exist(JSON.parse(this.args[2][2][3]).last_edited);
        should.not.exist(JSON.parse(this.args[2][2][4]).last_edited);

      }, done);
    });

    it("should not save unknown keys in the type change", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name",
        funny: "business"
      };

      this.stubValues = [
        [{db_call: "get_type_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_type_name"}],
        [{db_call: "save_type_change"}],
        [{db_call: "update_type_last_edited"}],
        [{db_call: "find_type_by_id"}]
      ];

      this.testEdit(function () {
        this.args[2][1].should.equal("save_type_change");
        should.not.exist(JSON.parse(this.args[2][2][4]).funny);
      }, done);
    });

    it("should return the new type", function (done) {
      this.fullBody = {
        id: 1,
        last_edited: "2000-01-01",
        name: "new name",
        funny: "business"
      };

      this.stubValues = [
        [{db_call: "get_type_lock", last_edited: "2000-01-01"}],
        [{db_call: "update_type_name"}],
        [{db_call: "save_type_change"}],
        [{db_call: "update_type_last_edited"}],
        [{db_call: "find_type_by_id", last_edited: "2014-01-01"}]
      ];

      this.testEdit(function () {
        this.result.last_edited.should.equal("2014-01-01");
      }, done);
    });

  });
});
