/*global describe, beforeEach, afterEach, it */
var sinon = require("sinon");
var when = require("when");
var db = require("../../../../lib/db");
var addEvent = require("../../../../lib/parser/writers/addEvent");

describe("adding events", function () {

  beforeEach(function () {

    sinon.stub(db, "runQuery", function () {
      var d = when.defer();

      setTimeout(function () {

        d.resolve({
          rows: [{
            id: 1
          }]
        });

      }, 1);

      return d.promise;
    });

  });

  describe("getDate", function () {

    it("should get date values where possible", function () {
      var date = addEvent.getDate(
        {"key": ["1948-12-13"]},
        ["key"]
      );
      date.should.equal("1948-12-13");
    });

    it("should get year values if that is all that is available", function () {
      var date = addEvent.getDate(
        {"key": ["1948"]},
        ["key"]
      );
      date.should.equal("1948-01-01");
    });


    it("should get year values for BCE dates", function () {
      var date = addEvent.getDate(
        {"key": ["-0065"]},
        ["key"]
      );
      date.should.equal("-0065-01-01");
    });

  });

  describe("combineDateTime", function () {

    it("should combine normal dates", function () {
      var timestamp = addEvent.combineDateTime(
        "2013-12-13",
        "09:34"
      );
      timestamp.should.equal("2013-12-13 09:34");
    });

    it("should handle BCE dates", function () {
      var timestamp = addEvent.combineDateTime(
        "-0046-12-13",
        "09:34"
      );
      timestamp.should.equal("0046-12-13 09:34 BC");
    });

  });

  afterEach(function () {
    db.runQuery.restore();
  });

});