/*global describe, beforeEach, afterEach, it */

var deserializeUser = require("../../../../lib/rest/auth/deserializeUser");
var stubDb = require("../../stubDb");
var tryTest = require("../../tryTest");
var should = require("should");

describe("deserializeUser", function () {

  beforeEach(function () {
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore();
  });

  it("should callback if a user is found", function (done) {
    var user = {};
    deserializeUser.deserializer(1, tryTest(function (err, result) {
      should.not.exist(err);
      result.should.equal(user);
    }, done));
    this.d[0].resolve({rows: [user]});
  });
  it("should callback with an error if a user is not found", function (done) {
    deserializeUser.deserializer(1, tryTest(function (err, result) {
      should.exist(err.message);
      should.not.exist(result);
    }, done));
    this.d[0].resolve({rows: []});
  });
  it("should callback with an error if an exception occurs", function (done) {
    deserializeUser.deserializer(1, tryTest(function (err, result) {
      should.exist(err.message);
      should.not.exist(result);
    }, done));
    this.d[0].reject({message: "some error"});
  });
});