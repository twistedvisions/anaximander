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
      _.bind(this.ensurePlace, this, params.place),
      function (placeId) {
        params.placeId = placeId;
      },
      _.bind(this.ensureParticipants, this, params.participants),
      function (participantIds) {
        _.forEach(params.participants, function (participant, i) {
          participant.id = participantIds[i];
        });
      },
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
        db.rollbackTransaction(this.tx);
        winston.error("could not create event");
        winston.error(JSON.stringify(e));
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
  if (place.id) {
    return db.runQueryInTransaction(
      this.tx, "find_place_by_id", [place.id]
    ).then(
      function (result) {
        if (result.rows.length === 0) {
          winston.error("tried to find a place that can't be found", place);
          throw {
            message: "no place found with id: " + place.id
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
      this.tx, "save_thing", [place.name, 3, place.link || ""]
    ).then(
      function (result) {
        if (result.rows === 0) {
          winston.error("tried to create a place but failed", place);
          throw {
            message: "tried to create a place but failed: " + JSON.stringify(place)
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

EventSaver.prototype.ensureParticipants = function (participants) {
  return when.all(_.map(participants, _.bind(this.ensureParticipant, this)));
};

EventSaver.prototype.ensureParticipant = function (participant) {
  try {
    if (!participant.roleId) {
      throw new Error("no role id in participant");
    }
    if (participant.id !== -1) {
      return db.runQueryInTransaction(this.tx, "find_thing_by_id", [participant.id]).then(
        function (result) {
          if (result.rows.length === 0) {
            winston.error("tried to find a thing that can't be found", participant);
            throw {
              message: "no place found with id: " + participant.id
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
      participant.name = participant.text;
      return db.runQueryInTransaction(
        this.tx, "save_thing", [participant.name, 1, participant.link || ""]
      ).then(
        function (result) {
          if (result.rows === 0) {
            winston.error("tried to create a thing but failed", participant);
            throw {
              message: "tried to create a thing but failed " +  JSON.stringify(participant)
            };
          }
          return result.rows[0].id;
        },
        function (e) {
          winston.error("failed to create thing", arguments);
          winston.error(e);
          throw e;
        }
      );
    }
  } catch (e) {
    winston.error("error while validating participant", e.message);
    throw e;
  }
};

EventSaver.prototype.createEvent = function (event) {
  event = _.extend({
    place_id: event.placeId,
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
      this.tx, "save_event", [event.name, event.place_id, event.start_date, event.end_date, event.link]
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
  var necessaryKeys = ["name", "place_id", "start_date", "end_date", "link"];
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
  return db.runQueryInTransaction(
    this.tx, "save_event_participant", [eventId, participant.id, participant.roleId]
  ).then(
    function (result) {
      return result.rowCount === 1;
    },
    function (e) {
      winston.error("failed to add participant /event");
      winston.error(e);
      throw e;
    }
  );
};

module.exports = {
  init: function (app) {
    var es = new EventSaver();
    app.post("/event", _.bind(es.saveEvent, es));
  },
  EventSaver: EventSaver
};