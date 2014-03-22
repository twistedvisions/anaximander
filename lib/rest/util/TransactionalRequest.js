var _ = require("underscore");
var db = require("../../db");
var pipeline = require("when/pipeline");
var when = require("when");
var winston = require("winston");

var TransactionalRequest = function () {};

TransactionalRequest.prototype.call = function (req, res, next) {
  if (this.authenticate(req)) {
    this.authenticationFailed(req, res, next);
  } else {
    try {
      this.validateRequest(req);
      var calls = _.flatten([
        [
          _.bind(this.startTransaction, this),
          _.bind(this.saveTransaction, this)
        ],
        this.getCalls(req, res, next),
        [
          _.bind(this.endTransaction, this),
          _.bind(this.setResponse, this),
          _.bind(this.sendResponse, this, res)
        ]
      ]);
      return pipeline(calls).then(
        _.bind(this.pipelineSucceeded, this),
        _.bind(this.pipelineFailed, this, req, res, next)
      );
    } catch (e) {
      next(e);
      return when.reject(e);
    }
  }
};


TransactionalRequest.prototype.authenticate = function (req) {
  var isAuthenticated = !req.isAuthenticated();
  if (isAuthenticated) {
    this.userId = req.user.id;
  }
  return isAuthenticated;
};

TransactionalRequest.prototype.authenticationFailed = function (req, res, next) {
  res.statusCode = 401;
  next(new Error("please login"));
};

TransactionalRequest.prototype.validateRequest = function (/*req*/) {
};

TransactionalRequest.prototype.startTransaction = function () {
  return db.startTransaction();
};

TransactionalRequest.prototype.saveTransaction = function (tx) {
  winston.verbose("saved tx");
  this.tx = tx;
};

TransactionalRequest.prototype.endTransaction = function () {
  db.endTransaction(this.tx);
};

TransactionalRequest.prototype.sendResponse = function (res) {
  res.send(this.responseData);
};

TransactionalRequest.prototype.pipelineSucceeded = function () {
  winston.verbose("saved event");
};

TransactionalRequest.prototype.pipelineFailed = function (req, res, next, e) {
  winston.error("could not create event - rolling back tx");
  winston.error(JSON.stringify(e));
  db.rollbackTransaction(this.tx);
  next(e);
};

module.exports = TransactionalRequest;
