/*global describe, beforeEach, afterEach, it */
var sinon = require("sinon");
var when = require("when");
var should = require("should");
var db = require("../../../../lib/db");
var addEvent = require("../../../../lib/parser/writers/addEvent");
var getPlace = require("../../../../lib/parser/writers/getPlace");
var addPeople = require("../../../../lib/parser/writers/addPeople");

describe("adding people", function () {

  var job;

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

    sinon.stub(addEvent, "addEvent");

    job = {
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
  });

  it("should create an id for each place from the database", function (done) {
    should.not.exist(job.data.value.id);
    should.not.exist(job.value);
    addPeople(job).then(function () {
      var ex;
      try {
        should.exist(job.value.id);
      } catch (e) {
        ex = e;
      }
      done(ex);
    }, function (err) {
      done(err);
    });
  });

  it("should add a birthday", function (done) {
    addPeople(job).then(function () {
      var ex;
      try {
        addEvent.addEvent.calledWith(
          "Person1", job, 
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
    addPeople(job).then(function () {
      var ex;
      try {
        addEvent.addEvent.calledWith(
          "Person1", job, 
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
    getPlace.byName.restore();
  });

});