/*global describe, it */
var getCurrentUser = require("../../../lib/rest/getCurrentUser");

describe("getCurrentUser", function () {
  var test = function (isAuthenticated, done) {
    var app = {
      get: function (path, handler) {
        var req = {
          isAuthenticated: function () {
            return isAuthenticated;
          }
        };
        var res = {
          send: function (value) {
            (value["logged-in"] === isAuthenticated).should.equal(true);
            done();
          }
        };
        handler(req, res);
        
      }
    };
    getCurrentUser.init(app);
  };

  it("should return with the user's logged in state when logged in", function (done) {
    test(true, done);
  });

  it("should return with the user's logged in state when logged out", function (done) {
    test(false, done);
  });
});