/*global describe, it, beforeEach, afterEach */

var sinon = require("sinon");

var when = require("when");


var stubDb = require("../stubDb");

// var register = require("../../../lib/rest/register");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("register", function () {
  beforeEach(function () {
    stubDb.setup(this);
  });
  afterEach(function () {
    stubDb.restore();
  });
  it("creates an entry in the database with a bcrypt-ed password");
  it("doesn't create an entry if the user already exists");
  it("should send a 422 if the user already exists");
  it("should log the user in");
});