/*global describe, it, beforeEach, afterEach */
/*jshint expr: true*/
var sinon = require("sinon");
var _ = require("underscore");
var should = require("should");

describe("db connector", function () {
  beforeEach(function () {
    this.db = require("../../lib/db");
  });
  describe("run query", function () {

    var pg = require("pg");
    var Transaction;

    beforeEach(function () {
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

    afterEach(function () {
      pg.connect.restore();
    });

    it("should get a connection", function (done) {
      this.db.runQuery("", []).then(function () {
        pg.connect.callCount.should.equal(1);
        done();
      });
    });


    it("should run the query", function (done) {
      this.db.runQuery("").then(function (result) {
        should.exist(result);
        result.should.equal("Some result");
        done();
      });
    });

    it("should allow transactions", function (done) {
      var errorHandler = function (e) {
        done(e);
      };
      var db = this.db;
      db.startTransaction().then(function (tx) {
        db.runQueryInTransaction(tx, "", []).then(
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
      var db = this.db;
      db.startTransaction().then(function (tx) {
        db.runQueryInTransaction(tx, "", []).then(
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

    describe("getQuery", function () {
      beforeEach(function () {
        sinon.stub(this.db, "_readDbFile", function () { return ""; });
        this.db._queries = {};
      });
      afterEach(function () {
        this.db._readDbFile.restore();
      });
      it("should name queries the same with the same name and the same template parameters", function () {
        var name1 = this.db._getQuery("some_name", [], {a: 1, b: 2}).name;
        var name2 = this.db._getQuery("some_name", [], {b: 2, a: 1}).name;
        name1.should.equal(name2);
      });
      it("should name queries differently with the same name but different template parameters", function () {
        var name1 = this.db._getQuery("some_name", [], {a: 1, b: 2}).name;
        var name2 = this.db._getQuery("some_name", [], {b: 2, a: 2}).name;
        name1.should.not.equal(name2);
      });
      it("should cache queries with the different names", function () {
        this.db._getQuery("some_name1", []);
        this.db._getQuery("some_name2", []);
        _.size(this.db._queries).should.equal(2);
      });
      it("should use an empty array if no values are passed", function () {
        var query = this.db._getQuery("some_name3");
        query.values.should.eql([]);
      });
    });
  });
});