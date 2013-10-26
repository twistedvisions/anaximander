var _ = require("underscore");
var when = require("when");
var pipeline = require("when/pipeline");
var nodefn = require("when/node/function");
var when = require("when");

var pg = require("pg"); 

var nconf = require("./config");

var conString = nconf.database.connection_string;

var _getConnection = function () {
  var d = when.defer();
  pg.connect(conString, function (err, client, done) {
    if (err) {
      d.reject(err);
    } else {
      d.resolve([client, done]);
    }
  });
  return d.promise;
};

var _runQuery = function (query, args) {

  var conn = args[0], 
      done = args[1];

  var d = when.defer();
  conn.query(query, function (err, result) {
    done();
    if (err) {
      d.reject(err);
    } else {
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
  pg.end();
};

module.exports = {
  runQuery: runQuery,
  end: end
};