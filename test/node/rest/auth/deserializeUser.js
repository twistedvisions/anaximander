/*global describe, beforeEach, afterEach, it */

var deserializeUser = require("../../../../lib/rest/auth/deserializeUser");
var stubDb = require("../../stubDb");
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
    deserializeUser.deserializer(1, function (err, result) {
      var ex;
      try {
        should.not.exist(err);
        result.should.equal(user);
      } catch (e) {
        ex = e;
      } finally {
        done(ex);
      }
    });
    this.d[0].resolve({rows: [user]});
  });
  it("should callback with an error if a user is not found", function (done) {
    deserializeUser.deserializer(1, function (err, result) {
      var ex;
      try {
        should.exist(err.message);
        should.not.exist(result);
      } catch (e) {
        ex = e;
      } finally {
        done(ex);
      }
    });
    this.d[0].resolve({rows: []});
  });
  it("should callback with an error if an exception occurs", function (done) {
    deserializeUser.deserializer(1, function (err, result) {
      var ex;
      try {
        should.exist(err.message);
        should.not.exist(result);
      } catch (e) {
        ex = e;
      } finally {
        done(ex);
      }
    });
    this.d[0].reject({message: "some error"});
  });
});