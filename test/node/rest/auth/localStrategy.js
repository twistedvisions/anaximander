/*global describe, it, beforeEach, afterEach */
var localStrategy = require("../../../../lib/rest/auth/localStrategy");

var should = require("should");
var sinon = require("sinon");

var _ = require("underscore");
var bcrypt = require("bcrypt");

var tryTest = require("../../tryTest");
var stubDb = require("../../stubDb");

describe("localStrategy", function () {

  beforeEach(function () {
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore(this);
  });

  it("should callback with an error if the user cannot be found", function (done) {
    localStrategy.localStrategyImpl(null, null,
      tryTest(function (err, user, message) {
      should.not.exist(err);
      user.should.equal(false);
      should.exist(message.message);
    }, done));
    stubDb.setQueryValues(this, [
      []
    ]);
  });
  it("should callback if a user's can be found and their password matches", function (done) {

    var username = "a";
    var plaintext = "abc";

    bcrypt.genSalt(10, _.bind(function (err, salt) {
      bcrypt.hash(plaintext, salt, _.bind(function (err, password) {

        localStrategy.localStrategyImpl(username, plaintext,
          tryTest(function (err, user, message) {
            should.not.exist(err);
            user.id.should.equal(3);
            should.not.exist(message);
          }, done
        ));

        stubDb.setQueryValues(this, [
          [{
            id: 3,
            username: username,
            password: password
          }]
        ]);

      }, this));
    }, this));

  });
  it("should callback with an error if an exception occurs running bcrypt", function (done) {
    var username = "a";
    var plaintext = "abc";

    sinon.stub(bcrypt, "compare", function (a, b, cb) {
      cb(new Error("some exception"));
    });

    localStrategy.localStrategyImpl(username, plaintext, tryTest(
      function (err, user, message) {
        should.exist(err);
        should.not.exist(message);
        should.not.exist(user);
      }, function (ex) {
        bcrypt.compare.restore();
        done(ex);
      }));
    stubDb.setQueryValues(this, [
      [{
        id: 4,
        username: username,
        password: "some pass"
      }]
    ]);

  });

  it("should callback with an message if the password does not match", function (done) {
    var username = "a";
    var plaintext = "abc";

    localStrategy.localStrategyImpl(username, plaintext,
      tryTest(function (err, user, message) {
        should.not.exist(err);
        user.should.equal(false);
        should.exist(message.message);
      }, done
    ));

    stubDb.setQueryValues(this, [
      [{
        id: 5,
        username: username,
        password: "some password"
      }]
    ]);
  });

  it("should callback with an error if an exception occurs running the query", function (done) {

    localStrategy.localStrategyImpl(null, null,
      tryTest(function (err, user, message) {
        should.exist(err);
        should.not.exist(user);
        should.not.exist(message);
      }, done
    ));

    stubDb.setQueryValues(this, [
      {"throw": {message: "some error"}}
    ]);
  });
});
