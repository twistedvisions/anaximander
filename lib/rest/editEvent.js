var _ = require("underscore");
var db = require("../db");
var when = require("when");
var moment = require("moment");
var pipeline = require("when/pipeline");
var TransactionRequest = require("./util/TransactionalRequest");
var EventUtils = require("./util/EventUtils");
var getEvent = require("./util/GetEvent");

var EventEditor = function () {};

_.extend(EventEditor.prototype, TransactionRequest.prototype);
_.extend(EventEditor.prototype, EventUtils.prototype);

EventEditor.prototype.validateRequest = function (req) {
  if (!req.body.id) {
    throw new Error("missing parameter 'id'");
  }

  if (_.keys(_.omit(req.body, ["id"])).length === 0) {
    throw new Error("no changes passed");
  }
};

EventEditor.prototype.getCalls = function (req/*, res, next*/) {
  this.params = req.body;
  return [
    _.bind(this.lockEvent, this, this.params.id, this.params.last_edited),
    _.bind(this.getEvent, this, this.params.id),
    _.bind(this.ensureOptionalPlace, this, this.params),
    _.bind(this.ensureOptionalEventType, this, this.params),
    _.bind(this.ensureOptionalEventImportance, this, this.params),
    _.bind(this.setOptionalDefaultEventImportance, this, this.params),
    _.bind(this.setOptionalTimezoneOffset, this, this.params),

    //do changes:
    //savename, link, start/end, event type/importance
    _.bind(this.updateEvent, this, this.params),
    //ensure participants
    _.bind(this.ensureNewParticipants, this, this.params.newParticipants || []),
    _.bind(this.ensureEditedParticipants, this, this.params.editedParticipants || []),
    _.bind(this.ensureRemovedParticipants, this, this.params.removedParticipants || []),
    //handle added participants
    _.bind(this.addParticipants, this, this.params.id, this.params.newParticipants || []),
    //handle edited participants
    _.bind(this.updateExistingParticipants, this, this.params.id, this.params.editedParticipants || []),
    //handle removed participants
    _.bind(this.removeParticipants, this, this.params.id, this.params.removedParticipants || []),
    //commit
    _.bind(this.saveEventChanges, this, this.params.id, this.params),
    _.bind(this.updateEventLastEdited, this, this.params.id)
  ];
};

EventEditor.prototype.lockEvent = function (id, reqLastEdited) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "get_event_lock", [id]
  ).then(
    function (result) {
      if (result.rows.length === 1) {
        var currentLastEdited = result.rows[0].last_edited;
        if (new Date(currentLastEdited).getTime() !== new Date(reqLastEdited).getTime()) {
          d.reject(new Error("lockEvent failed - last_edited times do not match - " +
            currentLastEdited + " vs " + reqLastEdited));
        } else {
          d.resolve();
        }
      } else {
        d.reject(new Error(
          "lockEvent expected 1 row, but received: " + result.rows.length
        ));
      }
    },
    d.reject
  );
  return d.promise;
};

EventEditor.prototype.getEvent = function (id) {
  var d = when.defer();
  getEvent(id, true).then(
    _.bind(function (event) {
      this.originalEvent = event;
      d.resolve();
    }, this),
    d.reject
  );
  return d.promise;
};

EventEditor.prototype.ensureOptionalPlace = function (params) {
  if (params.placeId) {
    params.place = {id: params.placeId};
  }
  if (params.place) {
    return this.ensurePlace(params.place).then(_.bind(function (placeId) {
      params.placeId = placeId;
    }, this));
  }
};
EventEditor.prototype.ensureOptionalEventType = function (params) {
  if (params.type) {
    return this.ensureEventType(params.type).then(_.bind(function (typeId) {
      params.typeId = typeId;
    }, this));
  }
};

EventEditor.prototype.ensureOptionalEventImportance = function (params) {
  if (params.importance) {
    params.importance.typeId = params.typeId || this.originalEvent.type.id;
    return this.ensureEventTypeImportance(params).then(_.bind(function (importanceId) {
      params.importanceId = importanceId;
    }, this));
  }
};

EventEditor.prototype.setOptionalDefaultEventImportance = function (params) {
  if (params.type && params.importance) {
    return this.setDefaultImportanceIfUnset(params.typeId, params.importanceId);
  }
};

EventEditor.prototype.setOptionalTimezoneOffset = function (params) {
  if (params.place || params.start_date || params.end_date) {
    var ignoreStartChange;
    var ignoreEndChange;
    if (!params.start_date) {
      params.start_date = this.originalEvent.start_date;
      ignoreStartChange = true;
    }
    if (!params.end_date) {
      params.end_date = this.originalEvent.end_date;
      ignoreEndChange = true;
    }
    params.start_date = moment(params.start_date).add("seconds", this.originalEvent.start_offset_seconds);
    params.end_date = moment(params.end_date).add("seconds", this.originalEvent.end_offset_seconds);
    var restorePlace;
    if (!params.placeId) {
      params.placeId = this.originalEvent.place.id;
      restorePlace = true;
    }
    return this.setTimezoneOffset(params).then(_.bind(function () {
      if (restorePlace) {
        delete params.placeId;
      }
      if (params.start_offset_seconds === this.originalEvent.start_offset_seconds) {
        if (ignoreStartChange) {
          delete params.start_date;
          delete params.start_offset_seconds;
        }
      }
      if (params.end_offset_seconds === this.originalEvent.end_offset_seconds) {
        if (ignoreEndChange) {
          delete params.end_date;
          delete params.end_offset_seconds;
        }
      }
    }, this));
  }
};

EventEditor.prototype.updateEvent = function (params) {
  return pipeline([
    _.bind(function () {
      if (params.name) {
        return db.runQueryInTransaction(
          this.tx, "update_event_name", [params.id, params.name]
        );
      }
    }, this),
    _.bind(function () {
      if (params.placeId) {
        return db.runQueryInTransaction(
          this.tx, "update_event_place", [params.id, params.placeId]
        );
      }
    }, this),
    _.bind(function () {
      if (params.link) {
        return db.runQueryInTransaction(
          this.tx, "update_event_link", [params.id, params.link]
        );
      }
    }, this),
    _.bind(function () {
      if (params.start_date) {
        return db.runQueryInTransaction(
          this.tx, "update_event_start_date",
          [params.id, params.start_date, params.start_offset_seconds]
        );
      }
    }, this),
    _.bind(function () {
      if (params.end_date) {
        return db.runQueryInTransaction(
          this.tx, "update_event_end_date",
          [params.id, params.end_date, params.end_offset_seconds]
        );
      }
    }, this),
    _.bind(function () {
      if (params.type && params.type.id) {
        return db.runQueryInTransaction(
          this.tx, "update_event_type", [params.id, params.typeId]
        );
      }
    }, this),
    _.bind(function () {
      if (params.importance && params.importance.id) {
        return db.runQueryInTransaction(
          this.tx, "update_event_importance", [params.id, params.importanceId]
        );
      }
    }, this)
  ]);
};

EventEditor.prototype.ensureNewParticipants = function (participants) {
  return when.map(participants, _.bind(this.ensureParticipant, this));
};

EventEditor.prototype.ensureEditedParticipants = function (participants) {
  var participantIds = _.map(participants, function (participant) {
    return participant.thing.id;
  });
  if (_.every(participantIds, this.ensureParticipantExists, this)) {
    return when.map(participants, _.bind(function (participant) {
      return this.ensureParticipant(participant, true);
    }, this));
  } else {
    return when.reject(new Error("not all participants to be removed exist"));
  }
};

EventEditor.prototype.updateExistingParticipants = function (eventId, participants) {
  return when.map(participants, _.bind(this.updateExistingParticipant, this, eventId));
};

EventEditor.prototype.updateExistingParticipant = function (eventId, participant) {
  return pipeline([
    _.bind(function () {
      if (participant.type && participant.type.id) {
        return db.runQueryInTransaction(
          this.tx, "update_participant_role",
          [eventId, participant.thing.id, participant.type.id]
        );
      }
    }, this),
    _.bind(function () {
      if (participant.importance && participant.importance.id) {
        return db.runQueryInTransaction(
          this.tx, "update_participant_importance",
          [participant.id, participant.thing.id, participant.importance.id]
        );
      }
    }, this)
  ]);
};

EventEditor.prototype.ensureRemovedParticipants = function (participantIds) {
  if (_.every(participantIds, this.ensureParticipantExists, this)) {
    return when.resolve();
  } else {
    return when.reject(new Error("not all participants to be removed exist"));
  }
};

EventEditor.prototype.ensureParticipantExists = function (thingId) {
  return !!_.find(this.originalEvent.participants, function (participant) {
    return participant.thing && participant.thing.id === thingId;
  });
};

EventEditor.prototype.removeParticipants = function (eventId, participantThingIds) {
  return when.map(participantThingIds, _.bind(this.removeParticipant, this, eventId));
};

EventEditor.prototype.removeParticipant = function (eventId, participantThingId) {
  return db.runQueryInTransaction(
    this.tx, "remove_participant",
    [eventId, participantThingId]
  );
};

EventEditor.prototype.setResponse = function () {
  this.responseData = {
    status: "ok"
  };
};

EventEditor.prototype.saveEventChanges = function (eventId, values) {
  var oldEvent = _.omit(this.originalEvent, ["last_edited"]);
  var newEvent = _.omit(values, ["last_edited", "importance", "type", "place"]);
  return db.runQueryInTransaction(
    this.tx, "save_event_change",
    [this.userId, this.userIp, eventId,
      JSON.stringify(oldEvent), JSON.stringify(newEvent)]
  );
};


EventEditor.prototype.updateEventLastEdited = function (eventId) {
  return db.runQueryInTransaction(
    this.tx, "update_event_last_edited",
    [eventId]
  );
};

module.exports = {
  init: function (app) {
    var es = new EventEditor();
    app.put("/event", _.bind(es.call, es));
  },
  EventEditor: EventEditor
};
