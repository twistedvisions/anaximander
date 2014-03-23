/*global describe, it, beforeEach, afterEach */

var sinon = require("sinon");
var should = require("should");
var _ = require("underscore");

var tryTest = require("../../tryTest");
var stubDb = require("../../stubDb");

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
    it("should process if you are logged in", function () {
      var req = {
        isAuthenticated: function () {
          return true;
        },
        user: {id: 100}
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
        user: {id: 100}
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
  });
});