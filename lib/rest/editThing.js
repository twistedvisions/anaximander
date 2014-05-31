var _ = require("underscore");
var db = require("../db");
var when = require("when");
var guard = require("when/guard");
var pipeline = require("when/pipeline");
var TransactionRequest = require("./util/TransactionalRequest");
var RequestUtils = require("./util/RequestUtils");
var getThing = require("./util/GetThing");

var ThingEditor = function () {};

_.extend(ThingEditor.prototype, TransactionRequest.prototype);
_.extend(ThingEditor.prototype, RequestUtils.prototype);

ThingEditor.prototype.validateRequest = function (req) {
  //todo: the id should be in the url
  if (!req.body.id) {
    throw new Error("missing parameter 'id'");
  }

  if (_.keys(_.omit(req.body, ["id"])).length === 0) {
    throw new Error("no changes passed");
  }
};

ThingEditor.prototype.checkUserPermissions = function () {
  if (!this.permissions["edit-thing"]) {
    throw new Error("User lacks 'edit-thing' permission");
  }
};

ThingEditor.prototype.getCalls = function (req/*, res, next*/) {
  this.params = req.body;
  return [
    _.bind(this.lockThing, this, this.params.id, this.params.last_edited),
    _.bind(this.getThing, this, this.params.id),
    _.bind(this.ensureOptionalThingType, this, this.params),
    _.bind(this.ensureOptionalNewThingSubtypesAndImportances, this, this.params),
    _.bind(this.ensureOptionalEditedThingSubtypesAndImportances, this, this.params),
    _.bind(this.ensureOptionalRemovedThingSubtypesImportances, this, this.params.removedSubtypes),

    //do changes:
    //name, link, type, subtype type/importance
    _.bind(this.updateThing, this, this.params),
    _.bind(this.addSubtypes, this, this.params),
    _.bind(this.changeSubtypesImportances, this, this.params),
    _.bind(this.removeSubtypes, this, this.params),
    _.bind(this.saveThingChanges, this, this.params.id, this.params),
    _.bind(this.updateThingLastEdited, this, this.params.id)
  ];
};

ThingEditor.prototype.lockThing = function (id, reqLastEdited) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "get_thing_lock", [id]
  ).then(
    function (result) {
      if (result.rows.length === 1) {
        var currentLastEdited = result.rows[0].last_edited;
        if (new Date(currentLastEdited).getTime() !== new Date(reqLastEdited).getTime()) {
          d.reject(new Error("lockThing failed - last_edited times do not match - " +
            currentLastEdited + " vs " + reqLastEdited));
        } else {
          d.resolve();
        }
      } else {
        d.reject(new Error(
          "lockThing expected 1 row, but received: " + result.rows.length
        ));
      }
    },
    d.reject
  );
  return d.promise;
};

ThingEditor.prototype.getThing = function (id) {
  var d = when.defer();
  getThing(id, true).then(
    _.bind(function (thing) {
      this.originalThing = thing;
      d.resolve();
    }, this),
    d.reject
  );
  return d.promise;
};

ThingEditor.prototype.ensureOptionalThingType = function (params) {
  if (params.typeId) {
    return this.ensure(
      {id: params.typeId},
      "thing type",
      "find_type_by_id",
      [
        function () { return params.typeId; },
        function () { return 4; }
      ],
      "find_type_by_id",
      [],
      ["add-type"]
    );
  }
};

ThingEditor.prototype.ensureOptionalNewThingSubtypesAndImportances = function (params) {
  if (params.newSubtypes) {
    var guardedEnsureSubtypeAndImportance = guard(
      guard.n(1),
      _.bind(this.ensureSubtypeAndImportance, this, params)
    );
    return when.all(
      _.map(
        params.newSubtypes,
        guardedEnsureSubtypeAndImportance
      )
    );
  }
};

ThingEditor.prototype.ensureOptionalEditedThingSubtypesAndImportances = function (params) {
  if (params.editedSubtypes) {
    var subtypeIds = _.map(_.keys(params.editedSubtypes), function (k) {return parseInt(k, 10); });
    if (_.every(subtypeIds, this.ensureSubtypeExists, this)) {
      var guardedEnsureSubtypeAndImportance = guard(
        guard.n(1),
        _.bind(
          function (importance, subtypeId) {
            return this.ensureSubtypeAndImportance(params, {
              type: {
                id: subtypeId
              },
              importance: importance
            });
          },
          this
        )
      );
      return when.all(
        _.map(
          params.editedSubtypes,
          guardedEnsureSubtypeAndImportance
        )
      );
    } else {
      return when.reject(new Error("not all subtypes to be changed exist"));
    }
  }
};

ThingEditor.prototype.ensureOptionalRemovedThingSubtypesImportances = function (subtypeIds) {
  if (subtypeIds) {
    if (_.every(subtypeIds, this.ensureSubtypeExists, this)) {
      return when.resolve();
    } else {
      return when.reject(new Error("not all participants to be removed exist"));
    }
  }
};

ThingEditor.prototype.ensureSubtypeExists = function (subtypeId) {
  return !!_.find(this.originalThing.subtypes, function (originalSubtype) {
    return originalSubtype.type && originalSubtype.type.id === subtypeId;
  });
};

ThingEditor.prototype.ensureSubtypeAndImportance = function (params, subtype) {

  return pipeline([
    _.bind(function () {
      return this.ensure(
        subtype.type,
        "thing subtype",
        "find_subtype_by_id",
        [
          "id",
          function () { return 4; },
          _.bind(function () {
            return params.typeId || this.originalThing.type_id;
          }, this)
        ],
        "save_subtype",
        [
          "name",
          function () { return 4; },
          _.bind(function () {
            return params.typeId || this.originalThing.type_id;
          }, this)
        ],
        ["add-type"]
      );
    }, this),
    function (subtypeId) {
      subtype.type.id = subtypeId;
    },
    _.bind(function () {
      return this.ensure(
        subtype.importance,
        "subtype importance",
        "find_importance_by_id",
        [
          "id",
          function () { return subtype.type.id; }
        ],
        "save_importance",
        [
          "name",
          "description",
          function () { return subtype.type.id; },
          "value"
        ],
        _.bind(this.hasImportancePermission, this)
      );
    }, this),
    function (importanceId) {
      subtype.importance.id = importanceId;
    }
  ]);
};

ThingEditor.prototype.updateThing = function (params) {
  return pipeline([
    _.bind(function () {
      if (params.name) {
        return db.runQueryInTransaction(
          this.tx, "update_thing_name", [params.id, params.name]
        );
      }
    }, this),
    _.bind(function () {
      if (params.link) {
        return db.runQueryInTransaction(
          this.tx, "update_thing_link", [params.id, params.link]
        );
      }
    }, this),
    _.bind(function () {
      if (params.typeId) {
        return db.runQueryInTransaction(
          this.tx, "update_thing_type", [params.id, params.typeId]
        );
      }
    }, this)
  ]);
};

ThingEditor.prototype.addSubtypes = function (params) {
  return when.all(
    _.map(params.newSubtypes, function (subtype) {
      return db.runQueryInTransaction(
        this.tx,
        "save_thing_subtype",
        [params.id, subtype.type.id, subtype.importance.id]
      );
    }, this)
  );
};

ThingEditor.prototype.changeSubtypesImportances = function (params) {
  return when.all(
    _.map(params.editedSubtypes, function (importance, subtypeId) {
      return db.runQueryInTransaction(
        this.tx,
        "update_thing_subtype_importance",
        [params.id, subtypeId, importance.id]
      );
    }, this)
  );
};

ThingEditor.prototype.removeSubtypes = function (params) {
  return when.all(
    _.map(params.removedSubtypes, function (subtypeId) {
      return db.runQueryInTransaction(
        this.tx,
        "remove_thing_subtype",
        [params.id, subtypeId]
      );
    }, this)
  );
};

ThingEditor.prototype.saveThingChanges = function (thingId, values) {
  var newThing = _.pick(values, ["reason", "name", "link", "typeId",
    "newSubtypes", "editedSubtypes", "removedSubtypes"]);
  var oldThing = _.pick(this.originalThing, _.keys(newThing));
  if (newThing.newSubtypes || newThing.editedSubtypes || newThing.removedSubtypes) {
    oldThing.subtypes = this.originalThing.subtypes;
  }
  if (newThing.typeId) {
    oldThing.type_id = this.originalThing.type_id;
  }
  if (newThing.newSubtypes) {
    newThing.newSubtypes = this.stripNewSubtypes(newThing.newSubtypes);
  }
  return db.runQueryInTransaction(
    this.tx, "save_thing_change",
    [this.userId, this.userIp, thingId,
      JSON.stringify(oldThing), JSON.stringify(newThing)]
  );
};

ThingEditor.prototype.stripNewSubtypes = function (newSubtypes) {
  return _.map(newSubtypes, function (newSubtype) {
    newSubtype = _.pick(newSubtype, ["type", "importance"]);
    newSubtype.type = _.pick(newSubtype.type, ["id", "name", "typeId", "defaultImportanceId"]);
    newSubtype.importance = _.pick(newSubtype.importance, ["id", "name"]);
    return newSubtype;
  });
};

ThingEditor.prototype.updateThingLastEdited = function (thingId) {
  return db.runQueryInTransaction(
    this.tx, "update_thing_last_edited",
    [thingId]
  );
};

ThingEditor.prototype.setResponse = function () {
  this.responseData = {
    status: "ok"
  };
};

module.exports = {
  init: function (app) {
    //todo: id should be in url
    app.put("/thing", function () {
      var thingEditor = new ThingEditor();
      thingEditor.call.apply(thingEditor, arguments);
    });
  },
  ThingEditor: ThingEditor
};
