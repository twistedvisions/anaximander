var sinon = require("sinon");
var when = require("when");
var should = require("should");
var db = require("../../../lib/db");
var addPeople = require("../../../lib/parser/writers/addPeople");

describe("addPlaces", function () {

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
        "<http://www.w3.org/2003/01/geo/wgs84_pos#lat>":[
          {"value":"\"10\"^^<http://www.w3.org/2001/XMLSchema#float>","link":"http://en.wikipedia.org/wiki/Name1"}
        ],
        "<http://www.w3.org/2003/01/geo/wgs84_pos#long>":[
          {"value":"\"-20\"^^<http://www.w3.org/2001/XMLSchema#float>","link":"http://en.wikipedia.org/wiki/Name1"}
        ]
      },
      "<http://dbpedia.org/resource/Person1>": {
        "<http://dbpedia.org/ontology/birthDate>":[
          {"value":"\"1948-12-13\"^^<http://www.w3.org/2001/XMLSchema#date>","link":"http://en.wikipedia.org/wiki/Name1"}
        ],
        "<http://dbpedia.org/ontology/birthPlace>":[
          {"value":"<http://dbpedia.org/resource/Place1>","link":"http://en.wikipedia.org/wiki/Name1"}
        ]
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

  it("should call the database 3 times", function (done) {
    addPeople(testData).then(function () {
      var ex;
      try {
        db.runQuery.calledThrice.should.be.true;
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
  });

});