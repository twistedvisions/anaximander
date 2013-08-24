var _ = require("underscore");
var when = require("when");
var pipeline = require("when/pipeline");
var nodefn = require("when/node/function");

var pg = require("pg"); 

var conString = "postgres://pretzel:@localhost/anax";

var call = function (x, name) {
  return nodefn.apply.apply(x, [x[name], _.rest(arguments, 2)]);
}

var _getConnection = function () {
  return call(pg, "connect", conString);
};

var _runQuery = function (query, args) {
  var conn = args[0], 
      done = args[1]
  return call(conn, "query", query).tap(done);
};

var runQuery = function (query) {
  return pipeline(
    [
      _getConnection,
      _.bind(_runQuery, this, query)
    ]
  );
};

module.exports = {
  runQuery: runQuery
};