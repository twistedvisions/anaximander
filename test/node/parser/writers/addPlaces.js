/*global describe, beforeEach, afterEach, it */
var sinon = require("sinon");
var when = require("when");
var should = require("should");
var db = require("../../../../lib/db");
var addPlaces = require("../../../../lib/parser/writers/addPlaces");

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
  });

  var testData;

  beforeEach(function () {
    testData = {
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
  });

  it("should create an id for each place from the database", function (done) {
    should.not.exist(testData["<http://dbpedia.org/resource/Name1>"].id);
    addPlaces(testData).then(function () {
      var ex;
      try {
        should.exist(testData["<http://dbpedia.org/resource/Name1>"].id);
      } catch (e) {
        ex = e;
      }
      done(ex);
    }, function (err) {
      done(err);
    });
  });

  after(function () {
    db.runQuery.restore();
  });

});