/*global describe, it, beforeEach, afterEach */
var facebookStrategy = require("../../../../lib/rest/auth/facebookStrategy");
var should = require("should");

var stubDb = require("../../stubDb");

describe("facebookStrategy", function () {
  
  beforeEach(function () {
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore(this);
  });

  it("should callback if a user is found", function (done) {
    facebookStrategy.facebookStrategyImpl(null, null, {id: 1}, function (err, user) {
      var ex;
      try {
        should.not.exist(err);
        user.id.should.equal(2);
      } catch (e) {
        ex = e;
      } finally {
        done(ex);
      }
    });
    stubDb.setQueryValues(this, [
      [{id: 2}]
    ]);
  });
  it("should create a new user if the user is unknown", function (done) {
    facebookStrategy.facebookStrategyImpl(null, null, {id: 1}, function (err, user) {
      var ex;
      try {
        should.not.exist(err);
        user.id.should.equal(43);
      } catch (e) {
        ex = e;
      } finally {
        done(ex);
      }
    });
    stubDb.setQueryValues(this, [
      [],
      [{id: 43}]
    ]);
  });
  it("should callback with an error if the user cannot be added", function (done) {
    facebookStrategy.facebookStrategyImpl(null, null, {id: 1}, function (err, user) {
      var ex;
      try {
        should.exist(err.message);
        should.not.exist(user);
      } catch (e) {
        ex = e;
      } finally {
        done(ex);
      }
    });
    stubDb.setQueryValues(this, [
      [],
      []
    ]);
  });
  it("should callback with an error if an exception occurs running the add user query", function (done) {
    facebookStrategy.facebookStrategyImpl(null, null, {id: 1}, function (err, user) {
      var ex;
      try {
        should.exist(err.message);
        should.not.exist(user);
      } catch (e) {
        ex = e;
      } finally {
        done(ex);
      }
    });
    stubDb.setQueryValues(this, [
      [],
      {"throw": {message: "some error"}}
    ]);
  });
  it("should callback with an error if an exception occurs running the get user query", function (done) {
    facebookStrategy.facebookStrategyImpl(null, null, {id: 1}, function (err, user) {
      var ex;
      try {
        should.exist(err.message);
        should.not.exist(user);
      } catch (e) {
        ex = e;
      } finally {
        done(ex);
      }
    });
    stubDb.setQueryValues(this, [
      {"throw": {message: "some error"}}
    ]);
  });
});
