/*global describe, beforeEach, afterEach, it */
/*jshint expr: true*/
var sinon = require("sinon");
var when = require("when");
var should = require("should");
var tryTest = require("../../tryTest");

require("../stubRedis");
var db = require("../../../../lib/parser/raw_db");
var addEvent = require("../../../../lib/parser/writers/addEvent");
var getPlace = require("../../../../lib/parser/writers/getPlace");



var processEvents = require("../../../../lib/parser/writers/processEvents");

describe("processing events", function () {

  var personJob, placeJob, organisationJob;

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

    sinon.stub(getPlace, "byName", function () {
      var d = when.defer();
      d.resolve(1);
      return d.promise;
    });

    sinon.stub(addEvent, "addEventWithPlace");

    personJob = {
      "log": function () {},
      "data": {
        "key": "<http://dbpedia.org/resource/Person1>",
        "link": "http://en.wikipedia.org/wiki/Person1",
        "value": escape(JSON.stringify({
          "<http://dbpedia.org/ontology/birthDate>": [
            "1948-12-13"
          ],
          "<http://dbpedia.org/ontology/birthPlace>": [
            "<http://dbpedia.org/resource/Place1>"
          ],
          "<http://dbpedia.org/ontology/deathDate>": [
            "1948-12-13"
          ],
          "<http://dbpedia.org/ontology/deathPlace>": [
            "<http://dbpedia.org/resource/Place1>"
          ]
        }))
      }
    };

    placeJob = {
      "log": function () {},
      "data": {
        "key": "<http://dbpedia.org/resource/Place1>",
        "link": "http://en.wikipedia.org/wiki/Place1",
        "value": escape(JSON.stringify({
          "<http://www.w3.org/2003/01/geo/wgs84_pos#lat>": [
            "41.169444444444444"
          ],
          "<http://www.w3.org/2003/01/geo/wgs84_pos#long>": [
            "42.16944443"
          ],
          "<http://dbpedia.org/ontology/foundingDate>": [
            "1948-12-13"
          ]
        }))
      }
    };

    organisationJob = {
      "log": function () {},
      "data": {
        "key": "<http://dbpedia.org/resource/Organisation1>",
        "link": "http://en.wikipedia.org/wiki/Organisation1",
        "value": escape(JSON.stringify({
          "<http://dbpedia.org/ontology/location>": [
            "<http://dbpedia.org/resource/Place1>"
          ],
          "<http://dbpedia.org/ontology/foundingDate>": [
            "1948-12-13"
          ],
          "<http://dbpedia.org/ontology/extinctionDate>": [
            "1949-12-13"
          ]
        }))
      }
    };

  });


  it("should create an id for each place from the database", function (done) {
    should.not.exist(personJob.data.value.id);
    should.not.exist(personJob.value);
    processEvents(personJob).then(
      tryTest(function () {
        should.exist(personJob.value.id);
      },
      done
    ), done);
  });

  it("should add a birthday", function (done) {
    processEvents(personJob).then(
      tryTest(function () {
        addEvent.addEventWithPlace.calledWith(
          "Person1", personJob,
          "born", "birth", ["<http://dbpedia.org/ontology/birthPlace>"],
          ["<http://dbpedia.org/ontology/birthDate>",
           "<http://dbpedia.org/ontology/birthYear>"]).should.equal(true);
      },
      done
    ), done);
  });


  it("should add a deathday", function (done) {
    processEvents(personJob).then(
      tryTest(function () {
        addEvent.addEventWithPlace.calledWith(
          "Person1", personJob,
          "died", "death", ["<http://dbpedia.org/ontology/deathPlace>"],
          ["<http://dbpedia.org/ontology/deathDate>",
           "<http://dbpedia.org/ontology/deathYear>"]).should.equal(true);
      },
      done
    ), done);
  });

  it("should create a founding event for places", function (done) {
    processEvents(placeJob).then(
      tryTest(function () {
        addEvent.addEventWithPlace.calledWith(
          "Place1", placeJob,
          "founded as a place", "place foundation", null,
          ["<http://dbpedia.org/ontology/foundingDate>",
           "<http://dbpedia.org/ontology/foundingYear>"]).should.equal(true);
      },
      done
    ), done);
  });

  it("should create a founding event for organisations", function (done) {
    processEvents(organisationJob).then(
      tryTest(function () {
        addEvent.addEventWithPlace.calledWith(
          "Organisation1", organisationJob,
          "founded as an organisation",
          "organisation foundation",
          [
            "<http://dbpedia.org/ontology/locationCity>",
            "<http://dbpedia.org/ontology/locationCountry>",
            "<http://dbpedia.org/ontology/location>",
            "<http://dbpedia.org/ontology/headquarter>"
          ],
          [
            "<http://dbpedia.org/ontology/foundingDate>",
            "<http://dbpedia.org/ontology/foundingYear>"
          ]).should.equal(true);
      },
      done
    ), done);
  });

  it("should create an extinction event for organisations", function (done) {
    processEvents(organisationJob).then(
      tryTest(function () {
        addEvent.addEventWithPlace.calledWith(
          "Organisation1", organisationJob,
          "went extinct as an organisation",
          "organisation extinction",
          [
            "<http://dbpedia.org/ontology/locationCity>",
            "<http://dbpedia.org/ontology/locationCountry>",
            "<http://dbpedia.org/ontology/location>",
            "<http://dbpedia.org/ontology/headquarter>"
          ],
          [
            "<http://dbpedia.org/ontology/extinctionDate>",
            "<http://dbpedia.org/ontology/extinctionYear>"
          ]).should.equal(true);
      },
      done
    ), done);
  });


  afterEach(function () {
    db.runQuery.restore();
    addEvent.addEventWithPlace.restore();
    getPlace.byName.restore();
  });

});