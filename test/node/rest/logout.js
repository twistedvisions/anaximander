/*global describe, it */
var logout = require("../../../lib/rest/logout");

describe("logout", function () {
  it("should log users out", function () {
    var loggedOut = false;
    var req = {
      logout: function () {
        loggedOut = true;
      }
    };
    var res = {
      send: function () {}
    };
    logout.logoutHandler(req, res);
    loggedOut.should.equal(true);
  });
});