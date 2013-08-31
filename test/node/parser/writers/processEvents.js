/*global describe, beforeEach, afterEach, it */
var sinon = require("sinon");
var when = require("when");
var should = require("should");
var db = require("../../../../lib/db");
var addEvent = require("../../../../lib/parser/writers/addEvent");
var getPlace = require("../../../../lib/parser/writers/getPlace");
var processEvents = require("../../../../lib/parser/writers/processEvents");

describe("adding people", function () {
  
  var personJob, placeJob;

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

  });


  it("should create an id for each place from the database", function (done) {
    should.not.exist(personJob.data.value.id);
    should.not.exist(personJob.value);
    processEvents(personJob).then(function () {
      var ex;
      try {
        should.exist(personJob.value.id);
      } catch (e) {
        ex = e;
      }
      done(ex);
    }, function (err) {
      done(err);
    });
  });

  it("should add a birthday", function (done) {
    processEvents(personJob).then(function () {
      var ex;
      try {
        addEvent.addEventWithPlace.calledWith(
          "Person1", personJob, 
          "born", "<http://dbpedia.org/ontology/birthPlace>",
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
    processEvents(personJob).then(function () {
      var ex;
      try {
        addEvent.addEventWithPlace.calledWith(
          "Person1", personJob, 
          "died", "<http://dbpedia.org/ontology/deathPlace>",
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


  it("should create a founding event", function (done) {
    processEvents(placeJob).then(function () {
      var ex;
      try {
        addEvent.addEventWithPlace.calledWith(
          "Place1", placeJob, 
          "founded", null,
          ["<http://dbpedia.org/ontology/foundingDate>",
           "<http://dbpedia.org/ontology/foundingYear>"]).should.be.true;
      } catch (e) {
        ex = e;
        console.log(e)
      }
      done(ex);
    }, function (err) {
      done(err);
    });
  });


  afterEach(function () {
    db.runQuery.restore();
    addEvent.addEventWithPlace.restore();
    getPlace.byName.restore();
  });

});