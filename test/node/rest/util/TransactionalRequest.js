/*global describe, it, beforeEach, afterEach */

var sinon = require("sinon");
var should = require("should");
var _ = require("underscore");

var stubDb = require("../../stubDb");

var tryTest = require("../../tryTest");

var TransactionalRequest = require("../../../../lib/rest/util/TransactionalRequest");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("TransactionalRequest", function () {

  beforeEach(function () {
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore(this);
  });

  describe("ensure", function () {
    beforeEach(function () {
      this.transactionalRequest = new TransactionalRequest();
    });
    it("should fail to process unless you are logged in", function (done) {
      var req = {
        isAuthenticated: function () {
          return false;
        }
      };
      var res = {};
      var next = function (e) {
        should.exist(e);
        done();
      };
      this.transactionalRequest.call(req, res, next);
    });
    it("should fail to process if you have saved too recently", function () {
      var req = {
        isAuthenticated: function () {
          return true;
        },
        user: {id: 100, last_save_time: new Date()}
      };
      var res = {};
      var ex;
      var next = function (e) {
        ex = e;
      };
      this.transactionalRequest.getCalls = function () { return []; };
      this.transactionalRequest.setResponse = function () {};
      this.transactionalRequest.call(req, res, next);
      should.exist(ex);
    });
    it("should process if you are logged in", function () {
      var req = {
        isAuthenticated: function () {
          return true;
        },
        user: {id: 100, last_save_time: new Date(0)}
      };
      var res = {};
      var ex;
      var next = function (e) {
        ex = e;
      };
      this.transactionalRequest.getCalls = function () { return []; };
      this.transactionalRequest.setResponse = function () {};
      this.transactionalRequest.call(req, res, next);
      should.not.exist(ex);
    });
    it("should set the user id if you are logged in", function () {
      var req = {
        isAuthenticated: function () {
          return true;
        },
        user: {id: 100, last_save_time: new Date(0)}
      };
      var res = {};
      var ex;
      var next = function (e) {
        ex = e;
      };
      this.transactionalRequest.getCalls = function () { return []; };
      this.transactionalRequest.setResponse = function () {};
      this.transactionalRequest.call(req, res, next);
      this.transactionalRequest.userId.should.equal(100);
    });
    it("should set the user ip if you are logged in", function () {
      var req = {
        isAuthenticated: function () {
          return true;
        },
        user: {id: 100, last_save_time: new Date(0)},
        ip: "123.45.67.89"
      };
      var res = {};
      var ex;
      var next = function (e) {
        ex = e;
      };
      this.transactionalRequest.getCalls = function () { return []; };
      this.transactionalRequest.setResponse = function () {};
      this.transactionalRequest.call(req, res, next);
      this.transactionalRequest.userIp.should.equal("123.45.67.89");
    });

    describe("permissions", function () {
      beforeEach(function () {
        this.stubValues = [
          [{db_call: "get_thing_lock", name: "permission-name1"}],
          [{db_call: "update_user_last_save_time"}]
        ];
        stubDb.setQueryValues(this, this.stubValues);
        this.req = {
          isAuthenticated: function () {
            return true;
          },
          user: {id: 100, last_save_time: new Date(0)}
        };
        this.res = {
          send: function () {}
        };
        this.next = function () {};
        this.transactionalRequest.getCalls = function () { return []; };
        this.transactionalRequest.setResponse = function () {};
        this.checkResponse = true;
        sinon.stub(this.transactionalRequest, "checkUserPermissions", _.bind(function () {
          if (!this.checkResponse) {
            throw new Error("user lacks permissions");
          }
        }, this));
      });
      it("should save the user's permissions by permission name", function (done) {

        this.transactionalRequest.call(this.req, this.res, this.next)
          .then(tryTest(_.bind(function () {
              should.exist(this.transactionalRequest.permissions["permission-name1"]);
            }, this), done)
          );
      });
      it("should check the user's permissions", function (done) {
        this.transactionalRequest.call(this.req, this.res, this.next)
          .then(tryTest(_.bind(function () {
              this.transactionalRequest.checkUserPermissions.calledOnce.should.equal(true);
            }, this), done)
          );
      });
      it("should fail if the user's permissions are not acceptable", function (done) {
        this.checkResponse = false;
        this.transactionalRequest.call(this.req, this.res, this.next)
          .then(
            function () {
              throw new Error("should not get here");
            },
            function (ex) {
              should.exist(ex);
              done();
            }
          );
      });
    });
  });
});
