/*global describe, before, after, beforeEach, it */
var sinon = require("sinon");
var when = require("when");
var should = require("should");
var tryTest = require("../../tryTest");
var db = require("../../../../lib/parser/raw_db");
var addPlaces = require("../../../../lib/parser/writers/addPlaces");
var acquireLock = require("../../../../lib/parser/acquireLock");

describe("addPlaces", function () {

  before(function () {

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

    sinon.stub(acquireLock, "start");
    sinon.stub(acquireLock, "acquireLock", function () {
      return when.resolve();
    });
  });

  var job;

  beforeEach(function () {
    job = {
      "<http://dbpedia.org/resource/Name1>": {
        "<http://www.w3.org/2003/01/geo/wgs84_pos#lat>": [
          {"value": "10"}
        ],
        "<http://www.w3.org/2003/01/geo/wgs84_pos#long>": [
          {"value": "-20"}
        ],
        "link": "http://en.wikipedia.org/wiki/Name1"
      }
    };

    job = {
      "log": function () {},
      "data": {
        "key": "<http://dbpedia.org/resource/Name1>",
        "link": "http://en.wikipedia.org/wiki/Name1",
        "value": escape(JSON.stringify({
          "<http://www.w3.org/2003/01/geo/wgs84_pos#lat>": [
            "10"
          ],
          "<http://www.w3.org/2003/01/geo/wgs84_pos#long>": [
            "-20"
          ]
        }))
      }
    };
  });

  it("should create an id for each place from the database", function (done) {
    should.not.exist(job.data.value.id);
    should.not.exist(job.value);
    addPlaces(job).then(
      tryTest(function () {
        should.exist(job.value.id);
      },
      done
    ), function (err) {
      done(err);
    });
  });

  after(function () {
    db.runQuery.restore();
  });

});