/*global describe, it */
var should = require("should");

var login = require("../../../lib/rest/login");

describe("login", function () {

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

  it("should send a 200 if the user can login", function () {
    var message;
    var loggedIn = false;
    var req = {
      logIn: function (user, next) {
        loggedIn = true;
        next();
      }
    };
    var res = {
      send: function (msg) {
        message = msg;
      }
    };
    login.authenticate(req, res, function () {}, null, {id: 3});
    loggedIn.should.equal(true);
    should.exist(message);
    message.id.should.equal(3);
  });
  
});