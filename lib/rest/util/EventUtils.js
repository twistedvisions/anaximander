var _ = require("underscore");
var when = require("when");
var guard = require("when/guard");
var sequence = require("when/sequence");
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

/*
  1. iterate over each participant and pull out all roles
  2. ensure each role
  3. set the id on the participant object, which will then be picked up in ensureParticipant()
*/
EventUtils.prototype.ensureParticipantTypesAndImportances = function (participants, eventTypeId) {
  return sequence([
    _.bind(this.ensureParticipantTypes, this),
    _.bind(this.ensureParticipantImportances, this),
    // _.bind(this.ensureParticipantThingTypes, this),
    // _.bind(this.ensureParticipantThingImportances, this)
  ], participants, eventTypeId);
};

EventUtils.prototype.ensureParticipantThingTypes = function (participants) {
  // fns.unshift(_.bind(this.ensureParticipantThingSubtypes, this, thing));
};
EventUtils.prototype.ensureParticipantThingImportances = function (participants) {
};

EventUtils.prototype.ensureParticipantTypes = function (participants, eventTypeId) {
  var newRoles = this.aggregateNewRoles(participants);
  var existingRoles = this.aggregateExistingRoles(participants);

  return sequence([
    _.bind(function () {
      return sequence(_.map(newRoles, _.bind(this.ensureNewTypes, this, eventTypeId)));
    }, this),

    _.bind(function () {
      return sequence(_.map(existingRoles, this.ensureExistingTypes, this));
    }, this)
  ]);
};

EventUtils.prototype.aggregateNewRoles = function (participants) {
  var newRoles = {};
  _.each(participants, function (participant) {
    var type = participant.type;

    if (!type.id || type.id < 0) {
      if (type.name) {
        newRoles[type.name] = newRoles[type.name] || {first: type, all: []};
        newRoles[type.name].all.push(type);
      }
    }
  });
  return newRoles;
};

EventUtils.prototype.aggregateExistingRoles = function (participants) {
  var existingRoles = {};
  _.each(participants, function (participant) {
    var type = participant.type;
    if (type.id && type.id >= 0) {
      existingRoles[type.id] = type;
    }
  });
  return existingRoles;
};

EventUtils.prototype.ensureNewTypes = function (eventTypeId, typeList) {
  return _.bind(function () {

    typeList.first.related_type_id = eventTypeId;
    //todo: refactor to not take map

    return this.ensureParticipantType({type: typeList.first}).then(
      //todo: this will fail when there are multiple
      function (participantTypeId) {

        _.each(typeList.all, function (type) {
          type.related_type_id = eventTypeId;
          type.id = participantTypeId;
          type.isNew = true;
        });
      }
    );
  }, this);
};

EventUtils.prototype.ensureExistingTypes = function (type) {
  return _.bind(function () {
    //todo: refactor to not take map?

    return this.ensureParticipantType({type: type}).then(
      function (participantTypeId) {
        type.id = participantTypeId;
      }
    );

  }, this);
};

EventUtils.prototype.ensureParticipantImportances = function (participants) {
  var newImportances = {};
  var existingImportances = {};

  _.each(participants, function (participant) {
    var type = participant.type;
    var importance = participant.importance;

    if (!importance.id || importance.id < 0) {
      if (importance.name) {
        //todo: if nominal, ignore
        newImportances[type.id] = newImportances[type.id] || {};
        newImportances[type.id][importance.name] = newImportances[type.id][importance.name] || {first: participant, all: []};
        newImportances[type.id][importance.name].all.push(participant);
      }
    } else {
      existingImportances[importance.id] = participant;
    }
  });

  return sequence([

    _.bind(function () {
      return sequence(_.map(newImportances, function (participantMap/*, typeId*/) {

        return _.bind(function () {

          return sequence(_.map(participantMap, function (participantList) {
            return _.bind(function () {

              //todo: refactor to not take map?
              return this.ensureParticipantImportance(participantList.first)
                .then(
                  _.bind(function (participantImportanceId) {

                    return sequence(_.map(participantList.all, function (participant) {
                      return _.bind(function () {
                        participant.importance.id = participantImportanceId;
                      }, this);
                    }, this));

                  }, this)
                );


            }, this);
          }, this))
          .then(_.bind(function () {
            var type = _.values(participantMap)[0].first.type;
            var importance = participantMap.nominal && participantMap.nominal.first.importance;
            //todo: see if any are nominal, and if so pass them
            //change sig to be type, optional importance
            //if importance not passed, create a defualt one
            return this.saveDefaultImportanceIfNecessary(type, importance);
          }, this));

        }, this);

      }, this));
    }, this),

    _.bind(function () {
      return sequence(_.map(existingImportances, function (participant) {

        return _.bind(function () {
          var d = when.defer();
          //todo: refactor to not take map?
          this.ensureParticipantImportance(participant).then(
            function (participantImportanceId) {
              participant.importance.id = participantImportanceId;
              //note: do not need to worry about creating a nominal importance
              //here because it needs be sorted out only in new ones,
              //which will correspond to a new type
              d.resolve();
            },
            d.reject
          );
          return d.promise;
        }, this);

      }, this));
    }, this)
  ]);
};

EventUtils.prototype.saveDefaultImportanceIfNecessary = function (type, nominalImportance) {
  var d = when.defer();
  if (type.isNew) {

    if (!nominalImportance) {
      //create nominal importance
      this.ensureParticipantImportance({
        type: type,
        importance: {
          name: "nominal",
          description: "a default value of importance for " + type.name,
          value: 5
        }
      }).then(_.bind(function (importanceId) {
        //set it as default
        return this.setDefaultImportanceIfUnset(type.id, importanceId)
          .then(d.resolve, d.reject);
      }, this), d.reject);
    } else {
      //its already nominal, set this one as default
      this.setDefaultImportanceIfUnset(type.id, nominalImportance.id)
        .then(d.resolve, d.reject);
    }
  } else {
    d.resolve();
  }
  return d.promise;
};

EventUtils.prototype.setDefaultImportanceIfUnset = function (typeId, importanceId) {
  return db.runQueryInTransaction(
    this.tx, "update_type_default_importance_when_null", [typeId, importanceId]
  );
};


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
      if (!participant.thing) {
        throw new Error("an existing thing needs to be passed");
      }
      if (!participant.type && !participant.importance) {
        throw new Error("no type or importance for participant");
      }
    }

    return this.ensureParticipantThingComponents(participant.thing)
      .otherwise(function (e) {
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
    "find_role_by_id", ["id", function () { return 3; }, "related_type_id"],
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
      fns.push(_.bind(this.addSubtypesToParticipantThing, this, thing, thing.subtypes));
      //todo: remove
      fns.unshift(_.bind(this.ensureParticipantThingSubtypes, this, thing));
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
