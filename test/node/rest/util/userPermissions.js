/*global describe, it, beforeEach, afterEach */
var stubDb = require("../../stubDb");
var tryTest = require("../../tryTest");
var userPermissions = require("../../../../lib/rest/util/userPermissions");

describe("userPermissions", function () {

  beforeEach(function () {
    stubDb.setup(this);
  });
  
  afterEach(function () {
    stubDb.restore(this);
  });

  describe("get", function () {
    it("should return a list of permisisons", function (done) {
      var permissions = [
        {id: 1, name: "some user permission"},
        {id: 2, name: "some global permission"}
      ];
      userPermissions.get().then(tryTest(function (result) {
        result.should.eql(permissions);
      }, done));
      stubDb.setQueryValues(this, [
        [{id: 1, name: "some user permission"}],
        [{id: 2, name: "some global permission"}]
      ]);
    });

    it("should remove duplicate permisisons", function (done) {
      var permissions = [
        {id: 1, name: "some user permission"}
      ];
      userPermissions.get().then(tryTest(function (result) {
        result.should.eql(permissions);
      }, done));
      stubDb.setQueryValues(this, [
        [{id: 1, name: "some user permission"}],
        [{id: 1, name: "some user permission"}]
      ]);
    });
  });

});