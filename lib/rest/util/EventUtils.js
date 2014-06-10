var _ = require("underscore");
var when = require("when");
var guard = require("when/guard");
var moment = require("moment");
var pipeline = require("when/pipeline");
var db = require("../../db");
var winston = require("winston");

var RequestUtils = require("./RequestUtils");

var EventUtils = function () {};

_.extend(EventUtils.prototype, RequestUtils.prototype);

EventUtils.prototype.ensureEventType = function (type) {
  return this.ensure(type, "event type",
    "find_type_by_id", ["id", function () { return 2; }],
    "save_type", ["name", function () { return 2; }],
    ["add-type"]);
};

EventUtils.prototype.ensureEventTypeImportance = function (params) {
  return this.ensure(params.importance, "event type importance",
    "find_importance_by_id",
    [
      "id",
      function (obj) { return obj.typeId || params.typeId; }
    ],
    "save_importance",
    [
      "name",
      "description",
      function (obj) { return obj.typeId || params.typeId; },
      "value"
    ],
    ["add-importance"]
  );
};

EventUtils.prototype.setDefaultImportanceIfUnset = function (typeId, importanceId) {
  return db.runQueryInTransaction(
    this.tx, "update_type_default_importance_when_null", [typeId, importanceId]
  );
};

EventUtils.prototype.ensurePlace = function (place) {
  var createPlace = place.id === -1;

  var d = when.defer();
  this.ensure(place, "place",
    "find_place_by_id", ["id"],
    "save_thing",
    [
      "name",
      function () { return 19; },
      function (place) { return place.link || ""; }
    ],
    ["add-thing"]
  ).then(
    _.bind(function (thingId) {
      if (createPlace) {
        place.id = thingId;
        this.createPlace(place).then(function () {
          d.resolve(thingId);
        }, d.reject);
      } else {
        d.resolve(thingId);
      }
    }, this),
    d.reject
  );
  return d.promise;
};

EventUtils.prototype.createPlace = function (place) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "save_place", [place.id, place.lon, place.lat]
  ).then(
    function (result) {
      if (result.rowCount === 0) {
        var msg = "tried to create a place but failed: " + JSON.stringify(place);
        winston.error(msg);
        d.reject(new Error(msg));
      }
      d.resolve();
    },
    function (e) {
      winston.error("failed to create place: " + JSON.stringify(place));
      d.reject(e);
      throw e;
    }
  );
  return d.promise;
};

/********************************
           Participants
********************************/

EventUtils.prototype.ensureParticipant = function (participant, isUpdate, eventTypeId) {
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
      if (!participant.thing) {
        throw new Error("an existing thing needs to be passed");
      }
      if (!participant.type && !participant.importance) {
        throw new Error("no type or importance for participant");
      }
    }
    if (!participant.type.related_type_id || participant.type.related_type_id === -1)  {
      participant.type.related_type_id = eventTypeId;
    }
    return pipeline([
      _.bind(function () {
        participant.hasNewType = !participant.type.id || participant.type.id < 0;
      }, this),
      _.bind(this.ensureParticipantType, this, participant),
      function (participantTypeId) {
        participant.type.id = participantTypeId;
      },
      _.bind(this.ensureParticipantImportance, this, participant),
      function (participantImportanceId) {
        participant.importance.id = participantImportanceId;
      },
      _.bind(function () {
        if (participant.hasNewType) {
          delete participant.hasNewType;
          this.setDefaultImportanceIfUnset(participant.type.id,
            participant.importance.id);
        }
      }, this),
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
    "find_type_by_id", ["id", function () { return 3; }],
    "save_role",
    [
      "name",
      "related_type_id"
    ],
    ["add-type"]
  );
};

EventUtils.prototype.ensureParticipantImportance = function (participant) {
  return this.ensure(participant.importance, "participant importance",
    "find_importance_by_id",
    [
      "id",
      function () { return participant.type.id; }
    ],
    "save_importance",
    [
      "name",
      "description",
      function () { return participant.type.id; },
      "value"
    ],
    _.bind(this.hasImportancePermission, this)
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
    ],
    ["add-thing"]
  );
};

EventUtils.prototype.ensureParticipantThingSubtypes = function (thing) {
  var guardedEnsureParticipantThingSubtype = guard(
    guard.n(1),
    _.bind(this.ensureParticipantThingSubtype, this, thing)
  );
  return when.map(thing.subtypes, guardedEnsureParticipantThingSubtype);
};

EventUtils.prototype.ensureParticipantThingSubtype = function (thing, subtype) {
  var d = when.defer();
  pipeline([
    _.bind(function () {
      subtype.hasNewType = !subtype.type.id || subtype.type.id < 0;
    }, this),
    _.bind(this.ensureParticipantThingSubtypeType, this, thing, subtype),
    function (id) {
      subtype.type.id = id;
    },
    _.bind(this.ensureParticipantThingSubtypeImportance, this, thing, subtype),
    function (id) {
      subtype.importance.id = id;
    },
    _.bind(function () {
      if (subtype.hasNewType) {
        delete subtype.hasNewType;
        this.setDefaultImportanceIfUnset(
          subtype.type.id,
          subtype.importance.id
        );
      }
    }, this)
  ]).then(
    function () {
      d.resolve(subtype);
    },
    d.reject
  );
  return d.promise;
};

EventUtils.prototype.ensureParticipantThingSubtypeType = function (thing, subtype) {
  return this.ensure(subtype.type, "participant thing subtype type",
    "find_type_by_id", ["id", function () { return 4; }],
    "save_subtype",
    [
      "name",
      function () { return 4; },
      function () { return thing.typeId; }
    ],
    ["add-type"]
  );
};

EventUtils.prototype.ensureParticipantThingSubtypeImportance = function (thing, subtype) {
  return this.ensure(subtype.importance, "participant thing subtype importance",
    "find_importance_by_id", ["id", function () { return subtype.type.id; }],
     "save_importance",
    [
      "name",
      "description",
      function () { return subtype.type.id; },
      "value"
    ],
    ["add-importance"]
  );
};

EventUtils.prototype.addSubtypesToParticipantThing = function (thing, subtypes) {
  return when.map(subtypes, _.bind(function (subtype) {
    return db.runQueryInTransaction(
      this.tx, "save_thing_subtype", [thing.id, subtype.type.id, subtype.importance.id]
    );
  }, this));
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

EventUtils.prototype.setTimezoneOffset = function (params) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "get_timezone_offset_at_place", [params.placeId]
  ).then(
    function (result) {

      if (result.rowCount === 0) {

        var msg = "tried to find a place timezone offset but failed: " +
          params.placeId;
        winston.error(msg);
        d.reject(new Error(msg));

      } else {
        //todo: handle daylight savings, or the time at that particular year
        var offset = parseInt(result.rows[0].offset, 10);
        params.start_date = moment(params.start_date)
          .add("seconds", -offset);
        params.end_date = moment(params.end_date)
          .add("seconds", -offset);
        params.start_offset_seconds = offset;
        params.end_offset_seconds = offset;
        d.resolve();
      }
    },
    function (e) {
      winston.error("failed to find place timezone offset: " + params.placeId);
      d.reject(e);
      throw e;
    }
  );
  return d.promise;
};

module.exports = EventUtils;
