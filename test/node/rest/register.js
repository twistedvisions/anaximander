/*global describe, it, beforeEach, afterEach */

var should = require("should");
var sinon = require("sinon");

var db = require("../../../lib/db");
var when = require("when");
var _ = require("underscore");

var require = require("../../../lib/rest/require");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("register", function () {
  beforeEach(function () {
    var self = this;
    self.d = [];
    self.args = [];
    sinon.stub(db, "runQueryInTransaction", function () {
      var d = when.defer();
      self.d.push(d);
      self.args.push(arguments);
      return d.promise;
    });
  });
  afterEach(function () {
    db.runQueryInTransaction.restore();
  });
  it("creates an entry in the database with a bcrypt-ed password");
  it("doesn't create an entry if the user already exists");
});