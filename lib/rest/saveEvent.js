var _ = require("underscore");
var db = require("../db");
var when = require("when");
var pipeline = require("when/pipeline");
var winston = require("winston");
var utils = require("../parser/utils");

var EventSaver = function () {};

EventSaver.prototype.saveEvent = function (req, res, next) {
  var params = req.body;
  if (!req.isAuthenticated()) {
    res.statusCode = 401;
    next(new Error("please login"));
  } else {
    return pipeline([
      _.bind(function () {
        return db.startTransaction();
      }, this),
      _.bind(this.saveTransaction, this),
      _.bind(this.ensureEventType, this, params.type),
      function (typeId) {
        params.typeId = typeId;
      },
      _.bind(this.ensureEventTypeImportance, this, params),
      function (importanceId) {
        params.importanceId = importanceId;
      },
      _.bind(this.ensurePlace, this, params.place),
      function (placeId) {
        params.placeId = placeId;
      },
      _.bind(this.ensureParticipants, this, params.participants),
      _.bind(this.createEvent, this, params),
      _.bind(this.addParticipants, this, params.participants),
      _.bind(this.endTransaction, this),
      function () {
        res.send({status: "ok"});
      }
    ]).then(
      function () {
        winston.verbose("saved event");
      },
      _.bind(function (e) {
        winston.error("could not create event - rolling back tx");
        winston.error(JSON.stringify(e));
        db.rollbackTransaction(this.tx);
        next(e);
      }, this)
    );
  }
};

EventSaver.prototype.saveTransaction = function (tx) {
  winston.verbose("saved tx");
  this.tx = tx;
};

EventSaver.prototype.endTransaction = function () {
  db.endTransaction(this.tx);
};

EventSaver.prototype.ensurePlace = function (place) {
  return this.ensure(place, "place",
    "find_place_by_id", ["id"],
    "save_thing",
    [
      "name",
      function () { return 3; },
      function (place) { return place.link || ""; }
    ]
  );
};

EventSaver.prototype.ensureEventType = function (type) {
  return this.ensure(type, "event type",
    "find_type_by_id", ["id"],
    "save_type", ["name", function () { return 2; }]);
};

EventSaver.prototype.ensureEventTypeImportance = function (params) {
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

EventSaver.prototype.ensureParticipants = function (participants) {
  return when.all(_.map(participants, _.bind(this.ensureParticipant, this)));
};

EventSaver.prototype.ensureParticipant = function (participant) {
  try {
    if (!participant.type) {
      throw new Error("no type for participant");
    }
    if (!participant.importance) {
      throw new Error("no importance for participant");
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

EventSaver.prototype.ensureParticipantType = function (participant) {
  return this.ensure(participant.type, "participant type",
    "find_type_by_id", ["id"],
    "save_type",
    [
      "name",
      function () { return 3; }
    ]
  );
};

EventSaver.prototype.ensureParticipantImportance = function (participant) {
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

EventSaver.prototype.ensureParticipantThingComponents = function (thing) {
  try {
    if (!thing.typeId) {
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
EventSaver.prototype.ensureParticipantThingSubtypes = function (thing) {
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
      function (e) {
        d.reject(e);
      }
    );
    return d.promise;
  }, this));
};

EventSaver.prototype.ensureParticipantThingSubtypeType = function (thing, subtype) {
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

EventSaver.prototype.ensureParticipantThingSubtypeImportance = function (thing, subtype) {
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

EventSaver.prototype.ensureParticipantThing = function (thing) {
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

EventSaver.prototype.addSubtypesToParticipantThing = function (thing, subtypes) {
  return when.map(subtypes, function (subtype) {
    return db.runQueryInTransaction(
      this.tx, "save_thing_subtype", [thing.id, subtype.type.id]
    );
  });
};

EventSaver.prototype.ensure = function (obj, name, findQuery, findKeys, saveQuery, saveKeys) {
  if (obj.id && (obj.id > 0)) {
    return db.runQueryInTransaction(
      this.tx, findQuery, this.getKeys(obj, findKeys)
    ).then(
      function (result) {
        if (result.rows.length === 0) {
          winston.error("tried to find an " + name + " that can't be found", obj);
          throw {
            message: "no " + name + " found with id: " + obj.id
          };
        }
        return result.rows[0].id;
      },
      function (e) {
        winston.error("failed to create event /event", arguments);
        throw e;
      }
    );
  } else {
    return db.runQueryInTransaction(
      this.tx, saveQuery, this.getKeys(obj, saveKeys)
    ).then(
      function (result) {
        if (result.rows === 0) {
          winston.error("tried to create a " + name + " but failed", obj);
          throw {
            message: "tried to create a " + name + " but failed: " + JSON.stringify(obj)
          };
        }
        return result.rows[0].id;
      },
      function (e) {
        winston.error("failed to create event /event", arguments);
        throw e;
      }
    );
  }
};

EventSaver.prototype.getKeys = function (obj, keys) {
  return _.map(keys, function (key) {
    if (_.isFunction(key)) {
      return key(obj);
    }
    return key.split(".").reduce(function (o, x) { return o[x]; }, obj);
  });
};

EventSaver.prototype.createEvent = function (event) {
  event = _.extend({
    place_id: event.placeId,
    type_id: event.typeId,
    importance_id: event.importanceId,
    start_date: event.start,
    end_date: event.end
  }, event);
  var validation = this.validateEvent(event);
  if (validation) {
    var d = when.defer();
    d.reject(validation);
    return d.promise;
  } else {
    event.name = utils.escapeQuote(event.name);
    return db.runQueryInTransaction(
      this.tx, "save_event", [event.name, event.type_id, event.importance_id,
        event.place_id, event.start_date, event.end_date, event.link]
    ).then(
      function (result) {
        return result.rows[0].id;
      },
      function (e) {
        winston.error("failed to create event /event", arguments);
        throw e;
      }
    );
  }
};

EventSaver.prototype.validateEvent = function (event) {
  var necessaryKeys = ["name", "type_id", "place_id", "start_date", "end_date", "link"];
  var notFoundKeys = _.filter(necessaryKeys, function (key) {
    if (!event[key]) {
      return true;
    }
    return false;
  });
  if (notFoundKeys.length > 0) {
    return {
      message: "The following necessary keys were not found: " + notFoundKeys.join(", ")
    };
  }
  if (new Date(event.start_date).getTime() > new Date(event.end_date).getTime()) {
    return {
      message: "the end date must be before the end date"
    };
  }
};

EventSaver.prototype.addParticipants = function (participants, eventId) {
  return when.map(participants, _.bind(this.addParticipant, this, eventId));
};

EventSaver.prototype.addParticipant = function (eventId, participant) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "save_event_participant", [eventId, participant.thing.id,
      participant.type.id, participant.importance.id]
  ).then(
    function (result) {
      if (result.rows.length === 1) {
        d.resolve();
      } else {
        d.reject(new Error("add participant added " + result.rowCount + " rows"));
      }
    },
    function (e) {
      winston.error("failed to add participant /event");
      winston.error(e);
      d.reject(e);
    }
  );
  return d.promise;
};

module.exports = {
  init: function (app) {
    var es = new EventSaver();
    app.post("/event", _.bind(es.saveEvent, es));
  },
  EventSaver: EventSaver
};