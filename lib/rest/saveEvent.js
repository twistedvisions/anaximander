var _ = require("underscore");
var db = require("../db");
var when = require("when");
var sequence = require("when/sequence");
var winston = require("winston");
var validator = require("validator");
var utils = require("../parser/utils");
var TransactionRequest = require("./util/TransactionalRequest");
var EventUtils = require("./util/EventUtils");
var DateUtils = require("./util/DateUtils");

var EventSaver = function () {};

_.extend(EventSaver.prototype, TransactionRequest.prototype);
_.extend(EventSaver.prototype, EventUtils.prototype);

EventSaver.prototype.checkUserPermissions = function () {
  if (!this.permissions["add-event"]) {
    throw new Error("User lacks 'add-event' permission");
  }
};

EventSaver.prototype.getCalls = function (req) {
  var params = req.body;
  return [
    _.bind(this.ensureEventType, this, params.type),
    function (typeId) {
      params.typeId = typeId;
    },
    _.bind(this.ensureEventTypeImportance, this, params),
    function (importanceId) {
      params.importanceId = importanceId;
    },
    _.bind(this.ensureDefaultEventTypeImportance, this, params),
    _.bind(this.ensurePlace, this, params.place),
    function (placeId) {
      params.placeId = placeId;
    },
    _.bind(this.ensureParticipants, this, params.participants, params),
    _.bind(this.setTimezoneOffset, this, params),
    _.bind(this.createEvent, this, params),
    function (eventId) {
      params.eventId = eventId;
    },
    _.bind(function () {
      //note, this needs to be done without currying, because
      //the eventId is only set in the previous thing in the pipe
      return this.addParticipants(params.eventId, params.participants);
    }, this),
    function () {
      return params;
    }
  ];
};

EventSaver.prototype.ensureDefaultEventTypeImportance = function (params) {
  if (params.type.id < 0) {
    return this.setDefaultImportanceIfUnset(params.typeId, params.importanceId);
  }
};

EventSaver.prototype.ensureParticipants = function (participants, params) {
  return sequence([
    _.bind(function () {
      return this.ensureParticipantTypesAndImportances(participants, params.typeId);
    }, this),
    _.bind(function () {
      return sequence(_.map(participants, function (participant) {
        return _.bind(this.ensureParticipant, this, participant, false, params.typeId);
      }, this));
    }, this)
  ]);
};

EventSaver.prototype.createEvent = function (event) {
  var d = when.defer();

  event = _.extend({
    place_id: event.placeId,
    type_id: event.typeId,
    importance_id: event.importanceId
  }, event);

  var validation = this.validateEvent(event);


  if (validation) {
    d.reject(validation);
  } else {
    event.name = utils.escapeQuote(event.name);
    this.ensureCreator().then(
      _.bind(function () {
        db.runQueryInTransaction(
          this.tx,
          "save_event",
          [
            this.creatorId, event.name,
            event.type_id, event.importance_id,
            event.place_id,
            DateUtils.formatDate(event.start_date),
            DateUtils.formatDate(event.end_date),
            event.start_offset_seconds, event.end_offset_seconds,
            event.link
          ]
        ).then(
          function (result) {
            if (result.rows.length === 1) {
              d.resolve(result.rows[0].id);
            } else {
              d.reject(new Error("failed to add event"));
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

EventSaver.prototype.validateEvent = function (event) {
  var necessaryKeys = ["name", "type_id", "importance_id", "place_id", "start_date", "end_date"];
  var notFoundKeys = _.filter(necessaryKeys, function (key) {
    if (!event[key]) {
      return true;
    }
    return false;
  });
  if (notFoundKeys.length > 0) {
    return new Error("The following necessary keys were not found: " + notFoundKeys.join(", "));
  }
  if (new Date(event.start_date).getTime() > new Date(event.end_date).getTime()) {
    return new Error("the end date must be before the end date");
  }
  if (event.link && !validator.isURL(event.link)) {
    return new Error("the link is invalid");
  }
};

EventSaver.prototype.setResponse = function (value) {
  this.responseData = {
    id: value.eventId
  };
};

module.exports = {
  init: function (app) {
    app.post("/event", function () {
      var es = new EventSaver();
      es.call.apply(es, arguments);
    });
  },
  EventSaver: EventSaver
};
