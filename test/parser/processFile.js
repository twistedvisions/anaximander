/*global describe, before, beforeEach, afterEach, it */
var sinon = require("sinon");
var should = require("should");
var _ = require("underscore");
var processFile = require("../../lib/parser/processFile");

describe("processFile", function () {

  var fs;

  var sampleData = [
    "header",
    "<http://dbpedia.org/resource/Name1> <http://www.w3.org/2003/01/geo/wgs84_pos#lat> \"A\"@en <http://en.wikipedia.org/wiki/Autism?oldid=495234324#absolute-line=14>",
    "<http://dbpedia.org/resource/Name2> <http://www.w3.org/2003/01/geo/wgs84_pos#lat> \"B\"@en <http://en.wikipedia.org/wiki/Autism?oldid=495234324#absolute-line=16>",
    "<http://dbpedia.org/resource/Name3> <http://www.w3.org/2003/01/geo/wgs84_pos#lat> \"C\"@en <http://en.wikipedia.org/wiki/Autism?oldid=495234324#absolute-line=18>",
    "<http://dbpedia.org/resource/Name4> <http://www.w3.org/2003/01/geo/wgs84_pos#lat> \"D\"@en <http://en.wikipedia.org/wiki/Autism?oldid=495234324#absolute-line=19>",
    "<http://dbpedia.org/resource/Name5> <http://www.w3.org/2003/01/geo/wgs84_pos#lat> \"E\"@en <http://en.wikipedia.org/wiki/Autism?oldid=495234324#absolute-line=20>",
    "<http://dbpedia.org/resource/Name6> <http://www.w3.org/2003/01/geo/wgs84_pos#somethingelse> \"F\"@en <http://en.wikipedia.org/wiki/Autism?oldid=495234324#absolute-line=21>",
    "<http://dbpedia.org/resource/Name7> <http://www.w3.org/2003/01/geo/wgs84_pos#lat> \"G\"@en <http://en.wikipedia.org/wiki/Autism?oldid=495234324#absolute-line=23>",
    "<http://dbpedia.org/resource/Name8> <http://www.w3.org/2003/01/geo/wgs84_pos#lat> \"H\"@en <http://en.wikipedia.org/wiki/Autism?oldid=495234324#absolute-line=10>",
    "<http://dbpedia.org/resource/Name8> <http://www.w3.org/2003/01/geo/wgs84_pos#long> \"I\"@en <http://en.wikipedia.org/wiki/Autism?oldid=495234324#absolute-line=10>",
    "<http://dbpedia.org/resource/Name8> <http://www.w3.org/2003/01/geo/wgs84_pos#lat> \"J\"@en <http://en.wikipedia.org/wiki/Autism?oldid=495234324#absolute-line=10>",
    "<http://dbpedia.org/resource/Name9> <http://www.w3.org/2003/01/geo/wgs84_pos#lat> \"K\"@en <http://en.wikipedia.org/wiki/Autism?oldid=495234324#absolute-line=10>"
  ].join("\n") + "\n";

  before(function () {
    fs = require("fs"); 
    sinon.stub(fs, "createReadStream", function () {
      var EventEmitter = require("events").EventEmitter;
      var x = new EventEmitter();
      setTimeout(function () {
        x.emit("data", sampleData);
      }, 1);
      return x;
    });
  });
  
  it("should process the first 4 lines bar 1", function (done) {
    processFile("", 4).then(function (data) {
      var ex;
      try {
        _.keys(data).length.should.equal(4);
      } catch (e) {
        ex = e;
      }
      done(ex);
    });
  });

  it("should only process interesting lines", function (done) {
    processFile("", 8).then(function (data) {
      var ex;
      try {
        _.keys(data).length.should.equal(7);
      } catch (e) {
        ex = e;
      }
      done(ex);
    });
  });

  it("should return the keys available for each object", function (done) {
    processFile("", 9).then(function (data) {
      var ex;
      try {
        _.keys(data["<http://dbpedia.org/resource/Name8>"]).length.should.equal(3);
      } catch (e) {
        ex = e;
      }
      done(ex);
    });
  });

  it("should have a value for a key", function (done) {
    processFile("", 9).then(function (data) {
      var ex;
      try {
        should.exists(
          data["<http://dbpedia.org/resource/Name8>"]
              ["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"]
              [0].value
        );
      } catch (e) {
        ex = e;
      }
      done(ex);
    });
  });

  it("should have a link for a value", function (done) {
    processFile("", 9).then(function (data) {
      var ex;
      try {
        should.exists(
          data["<http://dbpedia.org/resource/Name8>"].link
        );
      } catch (e) {
        ex = e;
      }
      done(ex);
    });
  });

  it("should store multiple values for a single key if given", function (done) {
    processFile("", 10).then(function (data) {
      var ex;
      try {
        data["<http://dbpedia.org/resource/Name8>"]
            ["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"]
            .length.should.equal(2)
        
      } catch (e) {
        ex = e;
      }
      done(ex);
    });
  });

  after(function () {
    fs.createReadStream.restore();
  });

});