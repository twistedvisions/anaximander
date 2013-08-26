/*global describe, beforeEach, afterEach, it */
var sinon = require("sinon");
var when = require("when");
var should = require("should");
var db = require("../../../../lib/db");
var addEvent = require("../../../../lib/parser/writers/addEvent");
var addPeople = require("../../../../lib/parser/writers/addPeople");

describe("adding people", function () {

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

    sinon.stub(addEvent, "addEvent");

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
        "<http://dbpedia.org/ontology/deathDate>": [
          {
            "value": "1948-12-13"
          }
        ],
        "<http://dbpedia.org/ontology/deathPlace>": [
          {
            "value": "<http://dbpedia.org/resource/Place1>",
          }
        ], 
        "link": "http://en.wikipedia.org/wiki/Person1"
      }
    };
  });

  it("should create an id for each place from the database", function (done) {
    should.not.exist(testData["<http://dbpedia.org/resource/Person1>"].id);
    addPeople(testData).then(function () {
      var ex;
      try {
        should.exist(testData["<http://dbpedia.org/resource/Person1>"].id);
      } catch (e) {
        ex = e;
      }
      done(ex);
    }, function (err) {
      done(err);
    });
  });

  it("should add a birthday", function (done) {
    addPeople(testData).then(function () {
      var ex;
      try {
        addEvent.addEvent.calledWith(
          sinon.match.any, sinon.match.any,
          "born", 1,
          ["<http://dbpedia.org/ontology/birthDate>", 
           "<http://dbpedia.org/ontology/birthYear>"]).should.be.true;
      } catch (e) {
        ex = e;
      }
      done(ex);
    }, function (err) {
      done(err);
    });
  });


  it("should add a deathday", function (done) {
    addPeople(testData).then(function () {
      var ex;
      try {
        addEvent.addEvent.calledWith(
          sinon.match.any, sinon.match.any, 
          "died", 1,
          ["<http://dbpedia.org/ontology/deathDate>",
           "<http://dbpedia.org/ontology/deathYear>"]).should.be.true;
      } catch (e) {
        ex = e;
      }
      done(ex);
    }, function (err) {
      done(err);
    });
  });

  afterEach(function () {
    db.runQuery.restore();
    addEvent.addEvent.restore();
  });

});