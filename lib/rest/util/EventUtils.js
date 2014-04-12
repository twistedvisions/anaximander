var _ = require("underscore");
var when = require("when");
var pipeline = require("when/pipeline");
var db = require("../../db");
var winston = require("winston");
var guard = require("when/guard");

var EventUtils = function () {};

EventUtils.prototype.ensureEventType = function (type) {
  return this.ensure(type, "event type",
    "find_type_by_id", ["id"],
    "save_type", ["name", function () { return 2; }]);
};

EventUtils.prototype.ensureEventTypeImportance = function (params) {
  return this.ensure(params.importance, "event type importance",
    "find_importance_by_id", ["id"],
    "save_importance",
    [
      "name",
      "description",
      function () { return params.typeId; },
      "value"
    ]
  );
};

/********************************
           Participants
********************************/

EventUtils.prototype.ensureParticipant = function (participant, isUpdate) {
  try {
    if (!participant.thing) {
      throw new Error("no thing for participant");
    }
    if (!isUpdate) {
      if (!participant.type) {
        throw new Error("no type for participant");
      }
      if (!participant.importance) {
        throw new Error("no importance for participant");
      }
    } else {
      if (!participant.thing || !participant.thing.id || participant.thing.id === -1) {
        throw new Error("an existing thing needs to be passed");
      }
      if (!participant.type && !participant.importance) {
        throw new Error("no type or importance for participant");
      }
    }
    return pipeline([
      _.bind(this.ensureParticipantType, this, participant),
      function (participantTypeId) {
        participant.type.id = participantTypeId;
      },
      _.bind(this.ensureParticipantImportance, this, participant),
      function (participantImportanceId) {
        participant.importance.id = participantImportanceId;
      },
      _.bind(this.ensureParticipantThingComponents, this, participant.thing)
    ]).otherwise(function (e) {
      winston.error("error while validating participant", e.message);
      winston.error(JSON.stringify(participant));
      throw e;
    });
  } catch (e) {
    winston.error("error while validating participant", e.message);
    throw e;
  }
};

EventUtils.prototype.ensureParticipantType = function (participant) {
  return this.ensure(participant.type, "participant type",
    "find_type_by_id", ["id"],
    "save_type",
    [
      "name",
      function () { return 3; }
    ]
  );
};

EventUtils.prototype.ensureParticipantImportance = function (participant) {
  return this.ensure(participant.importance, "participant importance",
    "find_importance_by_id", ["id"],
     "save_importance",
    [
      "name",
      "description",
      function () { return participant.type.id; },
      "value"
    ]
  );
};

EventUtils.prototype.ensureParticipantThingComponents = function (thing) {
  try {
    if (thing.id === -1 && !thing.typeId) {
      throw new Error("no type for participant thing");
    }
    var fns = [
      _.bind(this.ensureParticipantThing, this, thing),
      function (thingId) {
        thing.id = thingId;
      }
    ];
    if (thing.id === -1) {
      fns.unshift(_.bind(this.ensureParticipantThingSubtypes, this, thing));
      fns.push(_.bind(this.addSubtypesToParticipantThing, this, thing, thing.subtypes));
    }
    return pipeline(fns).otherwise(function (e) {
      winston.error("error while validating participant", e.message);
      winston.error(JSON.stringify(thing));
      throw e;
    });
  } catch (e) {
    winston.error("error while validating participant", e.message);
    throw e;
  }
};

EventUtils.prototype.ensureParticipantThing = function (thing) {
  return this.ensure(thing, "participant thing",
    "find_thing_by_id", ["id"],
    "save_thing",
    [
      "name",
      "typeId",
      function (thing) { return thing.link || ""; }
    ]
  );
};

EventUtils.prototype.ensureParticipantThingSubtypes = function (thing) {
  return when.map(thing.subtypes, _.bind(function (subtype) {
    var d = when.defer();
    pipeline([
      _.bind(this.ensureParticipantThingSubtypeType, this, thing, subtype),
      function (id) {
        subtype.type.id = id;
      },
      _.bind(this.ensureParticipantThingSubtypeImportance, this, thing, subtype),
      function (id) {
        subtype.importance.id = id;
      }
    ]).then(
      function () {
        d.resolve(subtype);
      },
      d.reject
    );
    return d.promise;
  }, this));
};

EventUtils.prototype.ensureParticipantThingSubtypeType = function (thing, subtype) {
  return this.ensure(subtype.type, "participant thing subtype type",
    "find_type_by_id", ["id"],
    "save_subtype",
    [
      "name",
      function () { return 4; },
      function () { return thing.typeId; }
    ]
  );
};

EventUtils.prototype.ensureParticipantThingSubtypeImportance = function (thing, subtype) {
  return this.ensure(subtype.importance, "participant thing subtype importance",
    "find_importance_by_id", ["id"],
     "save_importance",
    [
      "name",
      "description",
      function () { return subtype.type.id; },
      "value"
    ]
  );
};

EventUtils.prototype.addSubtypesToParticipantThing = function (thing, subtypes) {
  return when.map(subtypes, _.bind(function (subtype) {
    return db.runQueryInTransaction(
      this.tx, "save_thing_subtype", [thing.id, subtype.type.id, subtype.importance.id]
    );
  }, this));
};

/********************************
             Common
********************************/

EventUtils.prototype.ensure = function (obj, name, findQuery, findKeys, saveQuery, saveKeys) {
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
        var queryValues = this.getQueryValues(obj, saveKeys);
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
            d.reject(e);
          }
        );
      }, this),
      d.reject
    );
  }
  return d.promise;
};

EventUtils.prototype.getQueryValues = function (obj, keys) {
  return _.map(keys, function (key) {
    if (_.isFunction(key)) {
      return key(obj);
    }
    return key.split(".").reduce(function (o, x) { return o[x]; }, obj);
  });
};

EventUtils.prototype.addParticipants = function (eventId, participants) {
  return when.map(participants, _.bind(this.addParticipant, this, eventId));
};

EventUtils.prototype.addParticipant = function (eventId, participant) {
  return this.ensureCreator().then(_.bind(this._addParticipant, this, eventId, participant));
};

EventUtils.prototype._addParticipant = function (eventId, participant) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "save_event_participant",
      [this.creatorId, eventId, participant.thing.id,
      participant.type.id, participant.importance.id]
  ).then(
    function (result) {
      if (result.rows.length === 1) {
        d.resolve();
      } else {
        d.reject(new Error("add participant added " + result.rows.length + " rows"));
      }
    },
    function (e) {
      winston.error("failed to add participant");
      winston.error(e);
      d.reject(e);
    }
  );
  return d.promise;
};

EventUtils.prototype.ensureCreator = guard(guard.n(1), function () {
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

module.exports = EventUtils;
