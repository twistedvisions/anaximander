var _ = require("underscore");
var db = require("../db");
var when = require("when");
var sequence = require("when/sequence");
var moment = require("moment");
var validator = require("validator");
var pipeline = require("when/pipeline");
var TransactionRequest = require("./util/TransactionalRequest");
var EventUtils = require("./util/EventUtils");
var DateUtils = require("./util/DateUtils");
var EventUpdateMixins = require("./util/EventUpdateMixins");

var EventEditor = function () {};

_.extend(EventEditor.prototype, TransactionRequest.prototype);
_.extend(EventEditor.prototype, EventUtils.prototype);
_.extend(EventEditor.prototype, EventUpdateMixins.prototype);

EventEditor.prototype.validateRequest = function (req) {
  //todo: this should be in the url
  if (!req.body.id) {
    throw new Error("missing parameter 'id'");
  }

  if (_.keys(_.omit(req.body, ["id"])).length === 0) {
    throw new Error("no changes passed");
  }

  if (req.body.link && !validator.isURL(req.body.link)) {
    throw new Error("invalid link");
  }
};

EventEditor.prototype.checkUserPermissions = function () {
  if (!this.permissions["edit-event"]) {
    throw new Error("User lacks 'edit-event' permission");
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
    _.bind(this.ensureNewAndEditedParticipantComponents, this,
      this.params.newParticipants || [],
      this.params.editedParticipants || []
    ),
    _.bind(this.ensureNewParticipants, this,
      this.params.newParticipants || []
    ),
    _.bind(this.ensureEditedParticipants, this,
      this.params.editedParticipants || []
    ),
    _.bind(this.ensureRemovedParticipants, this,
      this.params.removedParticipants || []
    ),
    //handle added participants
    _.bind(this.addParticipants, this, this.params.id,
      this.params.newParticipants || []
    ),
    //handle edited participants
    _.bind(this.updateExistingParticipants, this, this.params.id,
      this.params.editedParticipants || []
    ),
    //handle removed participants
    _.bind(this.removeParticipants, this, this.params.id,
      this.params.removedParticipants || []
    ),
    //commit
    _.bind(this.saveEventChanges, this, this.params.id, this.params),
    _.bind(this.updateEventLastEdited, this, this.params.id)
  ];
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
          [params.id, DateUtils.formatDate(params.start_date), params.start_offset_seconds]
        );
      }
    }, this),
    _.bind(function () {
      if (params.end_date) {
        return db.runQueryInTransaction(
          this.tx, "update_event_end_date",
          [params.id, DateUtils.formatDate(params.end_date), params.end_offset_seconds]
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

EventEditor.prototype.ensureNewAndEditedParticipantComponents = function (newParticipants, editedParticipants) {
  return this.ensureParticipantTypesAndImportances(
    newParticipants.concat(editedParticipants),
    this.params.typeId || this.originalEvent.type.id
  );
};

EventEditor.prototype.ensureNewParticipants = function (participants) {
  return sequence(
    _.map(participants, function (participant) {
      return _.bind(function () {
        return this.ensureParticipant(
          participant, false,
          this.params.typeId || this.originalEvent.type.id
        );
      }, this);
    }, this)
  );
};

EventEditor.prototype.ensureEditedParticipants = function (participants) {

  var participantIds = _.map(participants, function (participant) {
    return participant.thing.id;
  });
  if (_.every(participantIds, this.ensureParticipantExists, this)) {
    //also ensure participant types and importnace
    return sequence(_.map(participants, function (participant) {
      return _.bind(function () {
        return this.ensureParticipant(
          participant, true,
          this.params.typeId || this.originalEvent.type.id
        );
      }, this);
    }, this));

  } else {
    return when.reject(new Error("not all participants to be changed exist"));
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
          [eventId, participant.thing.id, participant.importance.id]
        );
      }
    }, this)
  ]);
};

EventEditor.prototype.ensureRemovedParticipants = function (participantIds) {
  if (_.every(participantIds, this.ensureParticipantExists, this, false, -1)) {
    return when.resolve();
  } else {
    return when.reject(new Error("not all participants to be removed exist"));
  }
};

EventEditor.prototype.ensureParticipantExists = function (thingId) {
  return !!_.find(this.originalEvent.participants, function (originalParticipant) {
    return originalParticipant.thing && originalParticipant.thing.id === thingId;
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
  var newEvent = _.pick(values, [
    "reason", "name", "place", "link",
    "start_date", "end_date",
    "start_offset_seconds", "end_offset_seconds",
    "typeId", "importanceId",
    "newParticipants", "editedParticipants", "removedParticipants"
  ]);
  var oldEvent = _.pick(this.originalEvent, _.keys(newEvent));
  if (newEvent.typeId) {
    newEvent.type_id = newEvent.typeId;
    delete newEvent.typeId;
    oldEvent.type_id = this.originalEvent.type.id;
  }
  if (newEvent.importanceId) {
    newEvent.importance_id = newEvent.importanceId;
    delete newEvent.importanceId;
    oldEvent.importance_id = this.originalEvent.importance.id;
  }

  this.stripParticipants(newEvent.newParticipants);
  this.stripParticipants(newEvent.editedParticipants);
  if (newEvent.newParticipants || newEvent.editedParticipants || newEvent.removedParticipants) {
    oldEvent.participants = this.originalEvent.participants;
  }
  return db.runQueryInTransaction(
    this.tx, "save_event_change",
    [this.userId, this.userIp, eventId,
      JSON.stringify(oldEvent), JSON.stringify(newEvent)]
  );
};

EventEditor.prototype.stripParticipants = function (participants) {
  if (participants) {
    _.each(participants, function (participant) {
      //todo: move these lists to a central place - a model?
      participant.thing = participant.thing && _.pick(participant.thing, ["id", "name", "link", "typeId", "subtypes"]);
      participant.type = participant.type && _.pick(participant.type, ["id", "name", "defaultImportanceId", "typeId"]);
      participant.importance = participant.importance && _.pick(participant.importance, ["id", "name", "typeId"]);
    });
  }
};

EventEditor.prototype.setResponse = function (/*value*/) {
  this.responseData = {
    id: this.params.id
  };
};

module.exports = {
  init: function (app) {
    //todo: id should be in url
    app.put("/event", function () {
      var eventEditor = new EventEditor();
      eventEditor.call.apply(eventEditor, arguments);
    });
  },
  EventEditor: EventEditor
};
