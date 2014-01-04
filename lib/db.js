var fs = require("fs");
var _ = require("underscore");
var when = require("when");
var pipeline = require("when/pipeline");
var winston = require("winston");

var crypto = require("crypto");

var pg = require("pg"); 
var Transaction = require("pg-transaction");

var nconf = require("./config");

var conString = nconf.database.connection_string;

var db = function () {};

db.prototype._queries = {};

db.prototype._getConnection = function () {
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

db.prototype.runQuery = function (query, queryParameters, templateParameters) {
  return pipeline(
    [
      _.bind(this._getConnection, this),
      _.bind(this._runQuery, this, query, queryParameters, templateParameters)
    ]
  );
};

db.prototype._runQuery = function (queryName, queryParameters, templateParameters, args) {
  var conn = args[0], 
      done = args[1];

  return this._executeQuery(conn, queryName, queryParameters, templateParameters, done);
};

db.prototype.runQueryInTransaction = function (tx, queryName, queryParameters, templateParameters) {
  return this._executeQuery(tx.tx, queryName, queryParameters, templateParameters, null);
};

db.prototype._executeQuery = function (conn, queryName, queryParameters, templateParameters, done) {
  var d = when.defer();
  
  try {
    var queryObj = this._getQuery(queryName, queryParameters, templateParameters);
    winston.verbose("running db query", queryObj);
    conn.query(queryObj, _.bind(this._handleQueryResult, this, d, queryObj, done));
  } catch (e) {
    d.reject(e);
  }

  return d.promise;
};

db.prototype._getQueryText = function (text, templateParameters) {
  if (templateParameters && (_.size(templateParameters) > 0)) {
    return _.template(text, templateParameters);
  }
  return text;
};

db.prototype._getQuery = function (queryName, queryParameters, templateParameters) {
  if (queryName === "") {
    return {
      name: "empty",
      text: "select 1;",
      values: []
    };
  }
  var queryObj = {
    name: queryName + this._hashTemplateParameters(templateParameters),
    values: queryParameters || []
  };
  if (!this._queries[queryName]) {
    winston.verbose("first time using", queryName, ", generating prepared statement.");
    var query = this._readDbFile(queryName);    
    this._queries[queryName] = query;
  } else {
    winston.verbose(queryName, " is cached, reusing.");
  }
  queryObj.text = this._getQueryText(this._queries[queryName], templateParameters);
  return queryObj;
};

db.prototype._readDbFile = function (queryName) {
  return fs.readFileSync("db_templates/" + queryName + ".sql").toString();
};

db.prototype._handleQueryResult = function (d, queryObj, cb, err, result) {
  if (err) {
    winston.error("failed to run db query", queryObj);
    d.reject(err);
  } else {
    winston.verbose("db query succeeded", queryObj);
    d.resolve(result);
  }
  if (cb) {
    cb();
  }
};

db.prototype.end = function () {
  winston.verbose("closing db connection");
  pg.end();
};

db.prototype.startTransaction = function () {
  winston.verbose("creating transaction");
  return pipeline(
    [
      _.bind(this._getConnection, this),
      _.bind(this._startTransaction, this)
    ]
  );
};

db.prototype._startTransaction = function (args) {
  
  var conn = args[0], 
      done = args[1];

  var tx = new Transaction(conn);

  winston.verbose("transaction created");
  
  return {
    tx: tx,
    done: done
  };
};

db.prototype.endTransaction = function (tx) {
  
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

db.prototype.rollbackTransaction = function (tx) {

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

db.prototype._hashTemplateParameters = function (templateParameters) {
  if (!templateParameters) {
    return "";
  }

  var keys = _.keys(templateParameters);
  keys.sort();
  var string = [];
  _.each(keys, function (key) {
    string.push(key);
    string.push(templateParameters[key]);
  });
  return crypto.createHash("md5").update(string.join("")).digest("hex");
};

module.exports = new db();