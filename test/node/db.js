/*global describe, before, after, beforeEach, afterEach, it */
var sinon = require("sinon");
var should = require("should");
var db = require("../../lib/db");

describe("db connector", function () {
  describe("run query", function () {

    var pg;

    before(function () {
      pg = require("pg");

      sinon.stub(pg, "connect", function (err, cb) {
        cb(
          null, 
          [
            //connection api
            {
              query: function (queryString, cb) {
                cb(null, "Some result");
              }
            }, 
            //close connection callback
            function () {}
          ]
        );
      });
    });

    it("should get a connection", function (done) {
      db.runQuery("SELECT 1").then(function () {
        pg.connect.calledOnce.should.be.true;
        done();
      });
    });


    it("should run the query", function (done) {
      db.runQuery("SELECT 1").then(function (result) {
        should.exist(result);
        result.should.equal("Some result");
        done();
      });
    });

    after(function () {
      pg.connect.restore();
    });
  })
});