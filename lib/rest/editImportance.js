var _ = require("underscore");
var db = require("../db");
var when = require("when");
var pipeline = require("when/pipeline");
var TransactionRequest = require("./util/TransactionalRequest");
var RequestUtils = require("./util/RequestUtils");

var ImportanceEditor = function () {};

_.extend(ImportanceEditor.prototype, TransactionRequest.prototype);
_.extend(ImportanceEditor.prototype, RequestUtils.prototype);

ImportanceEditor.prototype.validateRequest = function (req) {
  //todo: the id should be in the url
  if (!req.body.id) {
    throw new Error("missing parameter 'id'");
  }

  if (_.keys(_.omit(req.body, ["id"])).length === 0) {
    throw new Error("no changes passed");
  }
};

ImportanceEditor.prototype.getCalls = function (req/*, res, next*/) {
  this.params = req.body;
  return [
    _.bind(this.lockImportance, this, this.params.id, this.params.last_edited),
    _.bind(this.getImportance, this, this.params.id, this.params.typeId),
    _.bind(this.updateImportance, this, this.params),
    _.bind(this.saveImportanceChanges, this, this.params.id, this.params),
    _.bind(this.updateImportanceLastEdited, this, this.params.id),
    _.bind(this.getNewImportance, this, this.params.id, this.params.typeId)
  ];
};

ImportanceEditor.prototype.lockImportance = function (id, reqLastEdited) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "get_importance_lock", [id]
  ).then(
    function (result) {
      if (result.rows.length === 1) {
        var currentLastEdited = result.rows[0].last_edited;
        if (new Date(currentLastEdited).getTime() !== new Date(reqLastEdited).getTime()) {
          d.reject(new Error("lockImportance failed - last_edited times do not match - " +
            currentLastEdited + " vs " + reqLastEdited));
        } else {
          d.resolve();
        }
      } else {
        d.reject(new Error(
          "lockImportance expected 1 row, but received: " + result.rows.length
        ));
      }
    },
    d.reject
  );
  return d.promise;
};

ImportanceEditor.prototype.getImportance = function (id, typeId) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "find_importance_by_id", [id, typeId]
  ).then(
    function (importance) {
      this.originalImportance = importance;
      d.resolve();
    },
    d.reject
  );
  return d.promise;
};


ImportanceEditor.prototype.updateImportance = function (params) {
  return pipeline([
    _.bind(function () {
      if (params.name) {
        return db.runQueryInTransaction(
          this.tx, "update_importance_name", [params.id, params.name]
        );
      }
    }, this),
    _.bind(function () {
      if (params.description) {
        return db.runQueryInTransaction(
          this.tx, "update_importance_description", [params.id, params.description]
        );
      }
    }, this),
    _.bind(function () {
      if (params.value !== undefined) {
        return db.runQueryInTransaction(
          this.tx, "update_importance_value", [params.id, params.value]
        );
      }
    }, this),
    _.bind(function () {
      if (params.defaultImportanceId) {
        return db.runQueryInTransaction(
          this.tx, "update_default_importance_id",
          [params.id, params.defaultImportanceId]
        );
      }
    }, this)
  ]);
};

ImportanceEditor.prototype.saveImportanceChanges = function (importanceId, values) {
  var oldImportance = _.omit(this.originalEvent, ["last_edited"]);
  var newImportance = _.pick(values, ["name", "description", "value"]);

  if (newImportance.name) {
    newImportance.name = newImportance.name.toLowerCase();
  }

  return db.runQueryInTransaction(
    this.tx, "save_importance_change",
    [
      this.userId, this.userIp, importanceId,
      JSON.stringify(oldImportance), JSON.stringify(newImportance)
    ]
  );
};

ImportanceEditor.prototype.updateImportanceLastEdited = function (thingId) {
  return db.runQueryInTransaction(
    this.tx, "update_importance_last_edited",
    [thingId]
  );
};

ImportanceEditor.prototype.getNewImportance = function (id, typeId) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "find_importance_by_id", [id, typeId]
  ).then(
    _.bind(function (result) {
      this.finalImportance = result.rows[0];
      d.resolve();
    }, this),
    d.reject
  );
  return d.promise;
};

ImportanceEditor.prototype.setResponse = function () {
  this.responseData = this.finalImportance;
};

module.exports = {
  init: function (app) {
    var importanceEditor = new ImportanceEditor();
    //todo: id should be in url
    app.put("/importance", _.bind(importanceEditor.call, importanceEditor));
  },
  ImportanceEditor: ImportanceEditor
};
