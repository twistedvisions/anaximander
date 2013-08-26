/*global describe, beforeEach, afterEach, it */
var sinon = require("sinon");
var when = require("when");
var should = require("should");
var db = require("../../../../lib/db");
var addEvent = require("../../../../lib/parser/writers/addEvent");

describe("adding events", function () {

  var testData;

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

    testData = {
      "<http://dbpedia.org/resource/Place1>": {
        id: 1,
        "<http://www.w3.org/2003/01/geo/wgs84_pos#lat>": [
          {
            "value": "\"10\"^^<http://www.w3.org/2001/XMLSchema#float>"
          }
        ],
        "<http://www.w3.org/2003/01/geo/wgs84_pos#long>": [
          {
            "value": "\"-20\"^^<http://www.w3.org/2001/XMLSchema#float>"
          }
        ], 
        "link": "http://en.wikipedia.org/wiki/Name1"
      },
      "<http://dbpedia.org/resource/Person1>": {
        "<http://dbpedia.org/ontology/birthDate>": [
          {
            "value": "1948-12-13"
          }
        ],
        "<http://dbpedia.org/ontology/birthPlace>": [
          {
            "value": "<http://dbpedia.org/resource/Place1>"
          }
        ], 
        "link": "http://en.wikipedia.org/wiki/Person1"
      },
      "<http://dbpedia.org/resource/Person2>": {
        "<http://dbpedia.org/ontology/birthYear>": [
          {
            "value": "1948"
          }
        ],
        "<http://dbpedia.org/ontology/birthPlace>": [
          {
            "value": "<http://dbpedia.org/resource/Place1>"
          }
        ], 
        "link": "http://en.wikipedia.org/wiki/Person1"
      },
      "<http://dbpedia.org/resource/Person3>": {
        "<http://dbpedia.org/ontology/birthYear>": [
          {
            "value": "-0065"
          }
        ],
        "<http://dbpedia.org/ontology/birthPlace>": [
          {
            "value": "<http://dbpedia.org/resource/Place1>"
          }
        ], 
        "link": "http://en.wikipedia.org/wiki/Person1"
      }
    };
  });

  describe("getDate", function () {

    it("should get date values where possible", function () {
      var date = addEvent.getDate(
        testData["<http://dbpedia.org/resource/Person1>"],
        ["<http://dbpedia.org/ontology/birthDate>",
         "<http://dbpedia.org/ontology/birthYear>"]
      );
      date.should.equal("1948-12-13");
    });

    it("should get year values if that is all that is available", function () {
      var date = addEvent.getDate(
        testData["<http://dbpedia.org/resource/Person2>"],
        ["<http://dbpedia.org/ontology/birthDate>",
         "<http://dbpedia.org/ontology/birthYear>"]
      );
      date.should.equal("1948-01-01");
    });


    it("should get year values for BCE dates", function () {
      var date = addEvent.getDate(
        testData["<http://dbpedia.org/resource/Person3>"],
        ["<http://dbpedia.org/ontology/birthDate>",
         "<http://dbpedia.org/ontology/birthYear>"]
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