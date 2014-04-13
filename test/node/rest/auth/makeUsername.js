/*global describe, it*/
var makeUsername = require("../../../../lib/rest/auth/makeUsername");

describe("makeUsername", function () {
  describe("username exists", function () {
    it("should prepend the username with the type", function () {
      var obj = {
        username: "myusername",
        emails: [{value: "me@domain.com"}],
        name: {
          familyName: "Smith",
          givenName: "John"
        }
      };
      makeUsername("type", obj);
      obj.username.should.equal("type:myusername");
    });
  });
  describe("email exists", function () {
    it("should prepend the email with the type", function () {
      var obj = {
        emails: [{value: "me@domain.com"}],
        name: {
          familyName: "Smith",
          givenName: "John"
        }
      };
      makeUsername("type", obj);
      obj.username.should.equal("type:me@domain.com");
    });
  });
  describe("json name", function () {
    it("should extract the given and family name", function () {
      var obj = {
        name: {
          familyName: "Smith",
          givenName: "John"
        }
      };
      makeUsername("type", obj);
      obj.username.should.equal("type:John_Smith");
    });
  });
  describe("plain name", function () {
    it("should prepend name with the type", function () {
      var obj = {
        name: "John Albert  Smith"
      };
      makeUsername("type", obj);
      obj.username.should.equal("type:John_Albert_Smith");
    });
  });
  describe("no identifier", function () {
    it("should generate the username randomly", function () {
      var obj = {};
      makeUsername("type", obj);
      obj.username.substring(0, 5).should.equal("type:");
      parseInt(obj.username.substring(5), 10).should.be.greaterThan(0);
    });
  });
});