var _ = require("underscore");
var when = require("when");
var pipeline = require("when/pipeline");
var when = require("when");
var winston = require("winston");

var pg = require("pg");

var nconf = require("../config");

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
  runQuery: runQuery,
  end: end
};