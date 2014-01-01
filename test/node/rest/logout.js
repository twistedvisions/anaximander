/*global describe, it */
var logout = require("../../../lib/rest/logout");

describe("logout", function () {
  it("should log users out", function () {
    var loggedOut = false;
    var user;
    var req = {
      logout: function () {
        loggedOut = true;
      }, 
      user: {id: 4}
    };
    var res = {
      send: function (data) {
        user = data;
      }
    };
    logout.logoutHandler(req, res);
    loggedOut.should.equal(true);
    user.id.should.equal(4);
  });
});