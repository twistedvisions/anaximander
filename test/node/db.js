/*global describe, before, after, it */
/*jshint expr: true*/
var sinon = require("sinon");
var should = require("should");
var db = require("../../lib/db");


describe("db connector", function () {
  describe("run query", function () {

    var pg;
    var Transaction;

    before(function () {
      pg = require("pg");
      Transaction = require("pg-transaction");

      sinon.stub(pg, "connect", function (err, cb) {
        cb(
          null, 
          //connection api
          {
            query: function (queryString, cb) {
              cb(null, "Some result");
              return {
                on: function () {}
              };
            },
            x: 11
          }, 
          //close connection callback
          function () {}
        );
      });
    });

    it("should get a connection", function (done) {
      db.runQuery("SELECT 1").then(function () {
        pg.connect.callCount.should.equal(1);
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

    it("should allow transactions", function (done) {
      var errorHandler = function (e) {
        done(e);
      };
      db.startTransaction().then(function (tx) {
        db.runQueryInTransaction("select 2", tx).then(
          function () {
            db.endTransaction(tx).then(
              function () {
                done();
              },
              errorHandler
            );
          }, 
          errorHandler
        );
      });
    });

    it("should allow transactions to be rolled back", function (done) {
      var errorHandler = function (e) {
        done(e);
      };
      db.startTransaction().then(function (tx) {
        db.runQueryInTransaction("select 2", tx).then(
          function () {
            db.rollbackTransaction(tx).then(
              function () {
                done();
              },
              errorHandler
            );
          }, 
          errorHandler
        );
      });
    });

    after(function () {
      pg.connect.restore();
    });
  });
});