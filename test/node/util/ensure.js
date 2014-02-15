/*global describe, it */
var ensure = require("../../../lib/util/ensure");
var should = require("should");

describe("ensure", function () {
  describe("float", function () {
    it("should pass floats back", function () {
      ensure.float(3.2).should.equal(3.2);
    });
    it("should throw an exception if the value is a string", function () {
      var e;
      try {
        ensure.float("3.2 --little bobby tables");
      } catch (_e) {
        e = _e;
      }
      should.exist(e);
    });
  });
  describe("intArray", function () {
    it("should pass int arrays", function () {
      ensure.intArray([1, 2, 3]).should.eql([1, 2, 3]);
    });
    it("should throw an exception if a value is not an int", function () {
      var e;
      try {
        ensure.intArray([1, 2, "3 --little bobby tables"]);
      } catch (_e) {
        e = _e;
      }
      should.exist(e);
    });
  });
});