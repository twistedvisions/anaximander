/*global describe, it */

var tryTest = require("../../tryTest");

var TypeGrouper = require("../../../../lib/rest/util/TypeGrouper");

var winston = require("winston");
try {
  winston.remove(winston.transports.Console);
} catch (e) {
  //wasn't there in the first place!
}

describe("getTypesById", function () {
  it("should group importances by type", function (done) {
    var res = {};
    res.send = function (data) {
      tryTest(function () {
        data.length.should.equal(2);
        data[0].importances.length.should.equal(2);
        data[1].importances.length.should.equal(1);
      }, done)();
    };
    TypeGrouper(res)({rows: [
      {id: 3, name: "t3", default_importance_id: 30, importance_id: 30, importance_name: "i30"},
      {id: 3, name: "t3", default_importance_id: 30, importance_id: 31, importance_name: "i31"},
      {id: 4, name: "t4", default_importance_id: 40, importance_id: 40, importance_name: "i40"}
    ]});
  });
  it("should sort the results by name order", function (done) {
    var res = {};
    res.send = function (data) {
      tryTest(function () {
        data.length.should.equal(2);
        data[0].name.should.equal("aaa");
        data[1].name.should.equal("bbb");
      }, done)();
    };
    TypeGrouper(res)({rows: [
      {id: 3, name: "bbb", default_importance_id: 30, importance_id: 30, importance_name: "i30"},
      {id: 3, name: "bbb", default_importance_id: 30, importance_id: 31, importance_name: "i31"},
      {id: 4, name: "aaa", default_importance_id: 40, importance_id: 40, importance_name: "i40"}
    ]});
  });

  it("should sort the results by related_type then name order", function (done) {
    var res = {};
    res.send = function (data) {
      tryTest(function () {
        data.length.should.equal(3);
        data[0].related_type.should.equal("aaa");
        data[1].related_type.should.equal("bbb");
        data[2].related_type.should.equal("bbb");

        data[0].name.should.equal("aaa");
        data[1].name.should.equal("aaa");
        data[2].name.should.equal("bbb");
      }, done)();
    };
    TypeGrouper(res)({rows: [
      {id: 3, related_type: "bbb", name: "bbb", default_importance_id: 30, importance_id: 30, importance_name: "i30"},
      {id: 3, related_type: "bbb", name: "bbb", default_importance_id: 30, importance_id: 31, importance_name: "i31"},
      {id: 4, related_type: "aaa", name: "aaa", default_importance_id: 40, importance_id: 40, importance_name: "i40"},
      {id: 5, related_type: "bbb", name: "aaa", default_importance_id: 40, importance_id: 40, importance_name: "i40"}
    ]});
  });

});
