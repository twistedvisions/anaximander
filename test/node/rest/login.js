/*global describe, it, beforeEach, afterEach */

var _ = require("underscore");
var when = require("when");
var sinon = require("sinon");
var should = require("should");

var login = require("../../../lib/rest/login");
var userPermissions = require("../../../lib/rest/util/userPermissions");

describe("login", function () {

  beforeEach(function () {
    sinon.stub(userPermissions, "get", function () {
      var d = when.defer();
      d.resolve([
        {id: 1, name: "some user permission"},
        {id: 2, name: "some global permission"}
      ]);
      return d.promise;
    });
  });
  
  afterEach(function () {
    userPermissions.get.restore();
  });

  it("should send a 400 if the username/password does not match", function () {
    var message;
    var res = {
      send: function (msg) {
        message = msg;
      }
    };
    login.authenticate({}, res, function () {}, null, null);
    res.statusCode.should.equal(400);
    should.exist(message);
  });

  it("should send a 500 if there is an exception", function () {
    var ex;
    var next = function (e) {
      ex = e;
    };
    login.authenticate({}, {}, next, {message: "some error"}, null);
    should.exist(ex);
  });

  describe("successful requests", function () {
    beforeEach(function () {
      this.loggedIn = false;
      var req = {
        logIn: _.bind(function (user, next) {
          this.d = next();
        }, this)
      };
      this.res = {
        statusCode: 200,
        send: _.bind(function (msg) {
          this.message = msg;
        }, this)
      };
      login.authenticate(req, this.res, function () {}, null, {id: 3});
    });

    it("should have a status code of 200", function (done) {
      this.d.then(_.bind(function () {
        should.exist(this.message);
        this.res.statusCode.should.equal(200);
        done();
      }, this));
    });
    
    it("should send an id if the user can login", function (done) {
      this.d.then(_.bind(function () {
        should.exist(this.message);
        this.message.id.should.equal(3);
        done();
      }, this));
    });

    it("should send the users permissions", function (done) {
      this.d.then(_.bind(function () {
        this.message.permissions.should.eql([
          {id: 1, name: "some user permission"},
          {id: 2, name: "some global permission"}
        ]);
        done();
      }, this));
    });
  });
});