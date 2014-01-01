var _ = require("underscore");
var when = require("when");
var pipeline = require("when/pipeline");
var when = require("when");
var winston = require("winston");

var pg = require("pg"); 
var Transaction = require("pg-transaction");

var nconf = require("./config");

var conString = nconf.database.connection_string;

var _getConnection = function () {
  var d = when.defer();
  winston.verbose("connecting to db", {connection_string: conString});
  pg.connect(conString, function (err, client, done) {
    if (err) {
      winston.error("db connection failed", {connection_string: conString});
      d.reject(err);
    } else {
      winston.verbose("db connection succeeded");
      d.resolve([client, done]);
    }
  });
  return d.promise;
};

var _startTransaction = function (args) {
  
  var conn = args[0], 
      done = args[1];

  var tx = new Transaction(conn);

  winston.verbose("transaction created");
  
  return {
    tx: tx,
    done: done
  };
};

var startTransaction = function () {
  winston.verbose("creating transaction");
  return pipeline(
    [
      _getConnection,
      _startTransaction
    ]
  );
};

var runQueryInTransaction = function (query, tx) {
  
  var d = when.defer();
  tx.tx.query(query, function (err, result) {
    if (err) {
      winston.error("failed to run db query", {query: query});
      d.reject(err);
    } else {
      winston.verbose("db query succeeded", {query: query});
      d.resolve(result);
    }
  });

  return d.promise;
};

var endTransaction = function (tx) {
  
  var d = when.defer();

  tx.tx.finished = true;

  tx.tx.commit(function (err) {
    tx.done();
    if (err) {
      winston.error("failed to commit transaction");
      winston.error(err);
      d.reject(err);
    } else {
      winston.verbose("transaction commit succeeded");
      d.resolve();
    }
  });

  return d.promise;
};

var rollbackTransaction = function (tx) {

  var d = when.defer();

  tx.tx.finished = true;
  tx.tx.failed = true;

  tx.tx.rollback(null, function (err) {

    tx.done();
    if (err) {
      winston.error("failed to commit transaction");
      winston.error(err);
      d.reject(err);
    } else {
      winston.verbose("transaction commit succeeded");
      d.resolve();
    }
  });

  return d.promise;
};

var _runQuery = function (query, args) {

  var conn = args[0], 
      done = args[1];

  var d = when.defer();
  winston.verbose("running db query", {query: query});

  conn.query(query, function (err, result) {
    done();
    if (err) {
      winston.error("failed to run db query", {query: query});
      d.reject(err);
    } else {
      winston.verbose("db query succeeded", {query: query});
      d.resolve(result);
    }
  });

  return d.promise;
};

var runQuery = function (query) {
  return pipeline(
    [
      _getConnection,
      _.bind(_runQuery, this, query)
    ]
  );
};

var end = function () {
  winston.verbose("closing db connection");
  pg.end();
};

module.exports = {
  startTransaction: startTransaction,
  runQueryInTransaction: runQueryInTransaction,
  endTransaction: endTransaction,
  rollbackTransaction: rollbackTransaction,

  runQuery: runQuery,
  end: end
};