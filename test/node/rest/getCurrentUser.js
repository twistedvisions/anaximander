/*global describe, it, beforeEach, afterEach */
var when = require("when");
var sinon = require("sinon");
var stubDb = require("../stubDb");
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
    stubDb.setup(this);
  });

  afterEach(function () {
    stubDb.restore(this);
    userPermissions.get.restore();
  });

  describe("logged in state", function () {
    var test = function (self, isAuthenticated) {

      var req = {
        isAuthenticated: function () {
          return isAuthenticated;
        },
        user: {id: 1, name: "john"}
      };

      var res = {
        send: function (value) {
          (value["logged-in"] === isAuthenticated).should.equal(true);
          if (isAuthenticated) {
            value.name.should.equal("john");
          }
          if (self.d.length === 1) {
            self.d[0].resolve({rows: []});
          }
        }
      };
      return getCurrentUser.handler(req, res);
    };

    it("should return with the user's logged in state when logged in", function (done) {
      test(this, true).then(function () { done(); });

      stubDb.setQueryValues(this, [[]]);
    });

    it("should store the user's ip when logged in", function (done) {
      var self = this;
      test(this, true).then(function () {
        tryTest(function () {
          self.args[0][0].should.equal("update_user_last_ip");
        }, done)();
      });
      stubDb.setQueryValues(this, [[]]);
    });

    it("should return with the user's logged in state when logged out", function (done) {
      test(this, false).then(done);
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