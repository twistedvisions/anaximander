var _ = require("underscore");
var when = require("when");
var db = require("../../db");
var winston = require("winston");
var guard = require("when/guard");

var RequestUtils = function () {};

RequestUtils.prototype.ensure = function (obj, name, findQuery, findKeys, saveQuery, saveKeys) {
  var d = when.defer();
  if (obj.id && (obj.id > 0)) {
    db.runQueryInTransaction(
      this.tx, findQuery, this.getQueryValues(obj, findKeys)
    ).then(
      function (result) {
        if (result.rows.length === 0) {
          winston.error("tried to find an " + name + " that can't be found", obj);
          d.reject(new Error("no " + name + " found with id: " + obj.id));
        } else {
          d.resolve(result.rows[0].id);
        }
      },
      function (e) {
        winston.error("failed to create event /event", arguments);
        d.reject(e);
      }
    );
  } else {
    this.ensureCreator().then(
      _.bind(function () {
        var queryValues;
        try {
          queryValues = this.getQueryValues(obj, saveKeys);
          queryValues.unshift(this.creatorId);
          db.runQueryInTransaction(
            this.tx, saveQuery, queryValues
          ).then(
            function (result) {
              if (result.rows.length === 0) {
                winston.error("tried to create a " + name + " but failed", obj);
                d.reject(new Error(
                  "tried to create a " + name + " but failed: " + JSON.stringify(obj)
                ));
              } else {
                d.resolve(result.rows[0].id);
              }
            },
            function (e) {
              winston.error("failed to create event /event", arguments);
              if (e.message.indexOf("duplicate key") >= 0) {
                d.reject(new Error("A " + name + " with the same name already exists - " + obj.id));
              } else {
                d.reject(e);
              }
            }
          );
        } catch (e) {
          d.reject(e);
        }
      }, this),
      d.reject
    );
  }
  return d.promise;
};

RequestUtils.prototype.getQueryValues = function (obj, keys) {
  return _.map(keys, function (key) {
    var value;
    if (_.isFunction(key)) {
      value = key(obj);
    } else {
      value = key.split(".").reduce(function (o, x) { return o[x]; }, obj);
    }
    if ((value !== null) && (value !== undefined)) {
      return value;
    } else {
      throw new Error("value not found for key: " + key);
    }
  });
};

RequestUtils.prototype.ensureCreator = guard(guard.n(1), function () {
  var d = when.defer();
  if (this.creatorId) {
    d.resolve(this.creatorId);
  } else {
    db.runQueryInTransaction(
      this.tx, "save_creator", [this.userId, this.userIp]
    ).then(
      _.bind(function (result) {
        if (result.rows.length === 1) {
          var creatorId = result.rows[0].id;
          this.creatorId = creatorId;
          d.resolve(creatorId);
        } else {
          d.reject(new Error("failed to add creator"));
        }
      }, this),
      d.reject
    );
  }
  return d.promise;
});

module.exports = RequestUtils;