/*global describe, it, beforeEach, afterEach */
var when = require("when");
var sinon = require("sinon");
var tryTest = require("../tryTest");
var getCurrentUser = require("../../../lib/rest/getCurrentUser");
var userPermissions = require("../../../lib/rest/util/userPermissions");

describe("getCurrentUser", function () {

  beforeEach(function () {
    sinon.stub(userPermissions, "get", function () {
      var d = when.defer();
      d.resolve([
        {id: 1, name: "some user permission"},
        {id: 2, name: "some global permission"}
      ]);
      return d.promise;
    });
  });

  afterEach(function () {
    userPermissions.get.restore();
  });

  describe("logged in state", function () {
    var test = function (isAuthenticated, done) {
      var app = {
        get: function (path, handler) {
          var req = {
            isAuthenticated: function () {
              return isAuthenticated;
            },
            user: {id: 1}
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

  describe("permissions", function () {
    it("should return a list of permisisons", function (done) {
      var permissions = [
        {id: 1, name: "some user permission"},
        {id: 2, name: "some global permission"}
      ];
      var app = {
        get: function (path, handler) {
          var req = {
            isAuthenticated: function () {
              return true;
            },
            user: {id: 1}
          };
          var res = {
            send: function (value) {
              tryTest(function () {
                value.permissions.should.eql(permissions);
              }, done)();
            }
          };
          handler(req, res);
        }
      };
      getCurrentUser.init(app);
    });
  });
});