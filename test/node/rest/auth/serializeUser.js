/*global describe, it */
var should = require("should");
var serializeUser = require("../../../../lib/rest/auth/serializeUser");

describe("serializeUser", function () {
  it("should callback with the users id", function (done) {
    serializeUser.serializeImpl({id: 1}, function (err, userId) {
      should.not.exist(err);
      userId.should.equal(1);
      done();
    });
  });
});