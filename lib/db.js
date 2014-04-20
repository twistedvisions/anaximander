var fs = require("fs");
var _ = require("underscore");
var when = require("when");
var pipeline = require("when/pipeline");
var winston = require("winston");

var crypto = require("crypto");

var pg = require("pg");

pg.defaults.parseInt8 = true;

var Transaction = require("pg-transaction");

var nconf = require("./config");

var conString = nconf.database.connection_string;

var db = function () {};

var id = 0;

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
      closeConnection = args[1];

  return this._executeQuery(conn, queryName, queryParameters, templateParameters, closeConnection);
};

db.prototype.runQueryInTransaction = function (tx, queryName, queryParameters, templateParameters) {
  winston.verbose("running query in transaction #" + tx.id);
  return this._executeQuery(tx.tx, queryName, queryParameters, templateParameters, null);
};

db.prototype._executeQuery = function (conn, queryName, queryParameters, templateParameters, closeConnection) {
  var d = when.defer();

  // if (conn.client)

  try {
    var queryObj = this._getQuery(queryName, queryParameters, templateParameters);
    winston.verbose("running db query", queryObj);
    conn.query(queryObj, _.bind(this._handleQueryResult, this, d, queryObj, closeConnection));
  } catch (e) {
    d.reject(e);
  }

  return d.promise;
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

db.prototype._getQueryText = function (text, templateParameters) {
  if (templateParameters && (_.size(templateParameters) > 0)) {
    return _.template(text, templateParameters);
  }
  return text;
};

db.prototype._readDbFile = function (queryName) {
  return fs.readFileSync("db_templates/" + queryName + ".sql").toString();
};

db.prototype._handleQueryResult = function (d, queryObj, closeConnection, err, result) {
  if (err) {
    winston.error("failed to run db query", queryObj);
    d.reject(err);
  } else {
    winston.verbose("db query succeeded", queryObj);
    d.resolve(result);
  }
  if (closeConnection) {
    winston.verbose("closing connection");
    closeConnection();
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
  var d = when.defer();
  var connection = args[0],
      closeConnectionFn = args[1];

  var tx = this._createTransaction(connection);

  id += 1;
  var txId = id;

  winston.verbose("transaction created with id #" + txId);

  tx.begin(function (err) {
    if (err) {
      winston.error("failed to begin transaction #" + txId);
      winston.error(JSON.stringify(err));
      d.reject(err);
    }
    winston.verbose("transaction began with id #" + txId);
    d.resolve({
      tx: tx,
      id: txId,
      closeConnection: closeConnectionFn
    });
  });

  return d.promise;
};

db.prototype._createTransaction = function (connection) {
  return new Transaction(connection);
};

db.prototype.endTransaction = function (tx) {

  var d = when.defer();

  tx.tx.finished = true;

  tx.tx.commit(function (err) {
    winston.verbose("close connection");
    tx.closeConnection();
    if (err) {
      winston.error("failed to commit transaction #" + tx.id);
      winston.error(err);
      d.reject(err);
    } else {
      winston.verbose("succeeded committing transaction #" + tx.id);
      d.resolve();
    }
  });

  return d.promise;
};

db.prototype.rollbackTransaction = function (tx) {

  var d = when.defer();

  tx.tx.finished = true;
  tx.tx.failed = true;

  winston.verbose("rolling back transaction #" + tx.id);
  tx.tx.rollback(null, function (err) {
    winston.verbose("close connection");
    tx.closeConnection();
    if (err) {
      winston.error("failed to rollback transaction #" + tx.id);
      winston.error(err);
      d.reject(err);
    } else {
      winston.verbose("succeeded rolling back transcation  #" + tx.id);
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
