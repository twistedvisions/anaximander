var _ = require("underscore");
var db = require("../../db");
var config = require("../../config");
var pipeline = require("when/pipeline");
var when = require("when");
var winston = require("winston");

var TransactionalRequest = function () {};

TransactionalRequest.prototype.call = function (req, res, next) {
  if (!this.authenticate(req)) {
    this.authenticationFailed(req, res, next);
  } else {
    try {
      this.limitRate(req, res);
      this.validateRequest(req);
      var calls = _.flatten([
        [
          _.bind(this.startTransaction, this),
          _.bind(this.saveTransaction, this),
          _.bind(this.getUserPermissions, this),
          _.bind(this.checkUserPermissions, this)
        ],
        this.getCalls(req, res, next),
        [
          _.bind(this.setResponse, this),
          _.bind(this.setLastSaveTime, this),
          _.bind(this.endTransaction, this),
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

TransactionalRequest.prototype.save_interval = config.server.save_rate;

TransactionalRequest.prototype.limitRate = function (req, res) {
  if (this.userLastSaveTime.getTime() > new Date().getTime() - this.save_interval) {
    res.statusCode = 429;
    throw new Error("Cannot save again so soon");
  }
};

TransactionalRequest.prototype.authenticate = function (req) {
  var isAuthenticated = !!req.isAuthenticated();
  if (isAuthenticated) {
    this.userId = req.user.id;
    this.userIp = req.ip;
    //is a JS Date object
    this.userLastSaveTime = req.user.last_save_time;
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

TransactionalRequest.prototype.setLastSaveTime = function () {
  return db.runQueryInTransaction(
    this.tx, "update_user_last_save_time", [this.userId]
  );
};

TransactionalRequest.prototype.getUserPermissions = function () {
  return db.runQueryInTransaction(
      this.tx, "get_user_permissions", [this.userId]
    ).then(_.bind(function (result) {
      var permissions = _.groupBy(result.rows, "name");
      this.permissions = permissions;
      return permissions;
    }, this));
};

TransactionalRequest.prototype.checkUserPermissions = function () {
};


TransactionalRequest.prototype.setResponse = function (/*value*/) {
  this.responseData = {
    status: "ok"
  };
};

TransactionalRequest.prototype.sendResponse = function (res) {
  res.send(this.responseData);
};

TransactionalRequest.prototype.pipelineSucceeded = function () {
  winston.verbose("calls complete");
};

TransactionalRequest.prototype.pipelineFailed = function (req, res, next, e) {
  winston.error("could not create event - rolling back tx");
  winston.error(JSON.stringify(e));
  db.rollbackTransaction(this.tx);
  next(e);
  return when.reject(e);
};

module.exports = TransactionalRequest;
