var _ = require("underscore");
var db = require("../db");
var when = require("when");
var pipeline = require("when/pipeline");
var TransactionRequest = require("./util/TransactionalRequest");
var RequestUtils = require("./util/RequestUtils");

var TypeEditor = function () {};

_.extend(TypeEditor.prototype, TransactionRequest.prototype);
_.extend(TypeEditor.prototype, RequestUtils.prototype);

TypeEditor.prototype.validateRequest = function (req) {
  //todo: the id should be in the url
  if (!req.body.id) {
    throw new Error("missing parameter 'id'");
  }

  if (_.keys(_.omit(req.body, ["id"])).length === 0) {
    throw new Error("no changes passed");
  }
};

TypeEditor.prototype.checkUserPermissions = function () {
  if (!this.permissions["edit-type"]) {
    throw new Error("User lacks 'edit-type' permission");
  }
};

TypeEditor.prototype.getCalls = function (req/*, res, next*/) {
  this.params = req.body;
  return [
    _.bind(this.lockType, this, this.params.id, this.params.last_edited),
    _.bind(this.getType, this, this.params.id, this.params.typeId),
    _.bind(this.ensureDefaultImportance, this, this.params),
    _.bind(this.updateType, this, this.params),
    _.bind(this.saveTypeChanges, this, this.params.id, this.params),
    _.bind(this.updateTypeLastEdited, this, this.params.id),
    _.bind(this.getNewType, this, this.params.id, this.params.typeId)
  ];
};

//Note: This doesn't mean the code has to lock every type + importance
//in an edit/create thing or event call
//because in such a call you can only create or get one
//not make any changes to one. Phew
TypeEditor.prototype.lockType = function (id, reqLastEdited) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "get_type_lock", [id]
  ).then(
    function (result) {
      if (result.rows.length === 1) {
        var currentLastEdited = result.rows[0].last_edited;
        if (new Date(currentLastEdited).getTime() !== new Date(reqLastEdited).getTime()) {
          d.reject(new Error("lockType failed - last_edited times do not match - " +
            currentLastEdited + " vs " + reqLastEdited));
        } else {
          d.resolve();
        }
      } else {
        d.reject(new Error(
          "lockType expected 1 row, but received: " + result.rows.length
        ));
      }
    },
    d.reject
  );
  return d.promise;
};

TypeEditor.prototype.getType = function (id, typeId) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "find_type_by_id", [id, typeId]
  ).then(
    _.bind(function (result) {
      this.originalType = result.rows[0];
      d.resolve();
    }, this),
    d.reject
  );
  return d.promise;
};

TypeEditor.prototype.ensureDefaultImportance = function (params) {
  if (params.defaultImportance) {
    return this.ensure(
      params.defaultImportance, "type importance",
      "find_importance_by_id",
      [
        "id",
        function () { return params.id; }
      ],
      "save_importance",
      [
        "name",
        "description",
        function () { return params.id; },
        "value"
      ],
      ["add-importance"]
    ).then(
      _.bind(function (importanceId) {
        params.defaultImportanceId = importanceId;
      }, this)
    );
  }
};

TypeEditor.prototype.updateType = function (params) {
  return pipeline([
    _.bind(function () {
      if (params.name) {
        return db.runQueryInTransaction(
          this.tx, "update_type_name", [params.id, params.name]
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

TypeEditor.prototype.saveTypeChanges = function (typeId, values) {
  var newType = _.pick(values, ["name", "defaultImportanceId"]);
  var oldType = _.pick(this.originalType, _.keys(newType));
  if (newType.name) {
    newType.name = newType.name.toLowerCase();
  }
  if (newType.defaultImportanceId) {
    newType.default_importance_id = newType.defaultImportanceId;
    delete newType.defaultImportanceId;
    oldType.default_importance_id = this.originalType.default_importance_id;
  }

  return db.runQueryInTransaction(
    this.tx, "save_type_change",
    [
      this.userId, this.userIp, typeId,
      JSON.stringify(oldType), JSON.stringify(newType)
    ]
  );
};

TypeEditor.prototype.updateTypeLastEdited = function (thingId) {
  return db.runQueryInTransaction(
    this.tx, "update_type_last_edited",
    [thingId]
  );
};

TypeEditor.prototype.getNewType = function (id, typeId) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "find_type_by_id", [id, typeId]
  ).then(
    _.bind(function (result) {
      this.finalType = result.rows[0];
      d.resolve();
    }, this),
    d.reject
  );
  return d.promise;
};

TypeEditor.prototype.setResponse = function () {
  this.responseData = this.finalType;
};

module.exports = {
  init: function (app) {
    //todo: id should be in url
    app.put("/type", function () {
      var typeEditor = new TypeEditor();
      typeEditor.call.apply(typeEditor, arguments);
    });
  },
  TypeEditor: TypeEditor
};
