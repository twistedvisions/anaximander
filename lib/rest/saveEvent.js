var _ = require("underscore");
var db = require("../db");
var when = require("when");
var winston = require("winston");
var utils = require("../parser/utils");
var TransactionRequest = require("./util/TransactionalRequest");
var EventUtils = require("./util/EventUtils");

var EventSaver = function () {};

_.extend(EventSaver.prototype, TransactionRequest.prototype);
_.extend(EventSaver.prototype, EventUtils.prototype);

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
    _.bind(this.ensurePlace, this, params.place),
    function (placeId) {
      params.placeId = placeId;
    },
    _.bind(this.ensureParticipants, this, params.participants),
    _.bind(this.createEvent, this, params),
    function (eventId) {
      params.eventId = eventId;
    },
    _.bind(function () {
      //note, this needs to be done without currying, because
      //the eventId is only set in the previous thing in the pipe
      return this.addParticipants(params.eventId, params.participants);
    }, this)
  ];
};

EventSaver.prototype.ensurePlace = function (place) {
  var createPlace = place.id === -1;

  var d = when.defer();
  this.ensure(place, "place",
    "find_place_by_id", ["id"],
    "save_thing",
    [
      "name",
      function () { return 3; },
      function (place) { return place.link || ""; }
    ]
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
    }, this)
  );
  return d.promise;
};

EventSaver.prototype.createPlace = function (place) {
  var d = when.defer();
  db.runQueryInTransaction(
    this.tx, "save_place", [place.id, place.lon, place.lat]
  ).then(
    function (result) {
      if (result.rowCount === 0) {
        winston.error("tried to create a place but failed", place);
        throw {
          message: "tried to create a place but failed: " + JSON.stringify(place)
        };
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

EventSaver.prototype.ensureParticipants = function (participants) {
  return when.all(_.map(participants, _.bind(this.ensureParticipant, this)));
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
          this.tx, "save_event", [this.creatorId, event.name, event.type_id, event.importance_id,
            event.place_id, event.start_date, event.end_date, event.link]
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

EventSaver.prototype.setResponse = function () {
  this.responseData = {
    status: "ok"
  };
};

module.exports = {
  init: function (app) {
    var es = new EventSaver();
    app.post("/event", _.bind(es.call, es));
  },
  EventSaver: EventSaver
};
