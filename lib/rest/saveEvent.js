var _ = require("underscore");
var fs = require("fs");
var db = require("../db");
var when = require("when");
var pipeline = require("when/pipeline");
var winston = require("winston");

var findPlaceById = _.template(fs.readFileSync("db_templates/find_place_by_id.sql").toString());
var findThingById = _.template(fs.readFileSync("db_templates/find_thing_by_id.sql").toString());
var saveThing = _.template(fs.readFileSync("db_templates/save_thing.sql").toString());
var saveEvent = _.template(fs.readFileSync("db_templates/save_event.sql").toString());
var saveEventParticipant = _.template(fs.readFileSync("db_templates/save_event_participant.sql").toString());

var EventSaver = function () {};

EventSaver.prototype.saveEvent = function (req, res) {
  var params = req.body;
  return pipeline([
    db.startTransaction,
    _.bind(this.saveTransaction, this),
    _.bind(this.ensurePlace, this, params.place),
    function (placeId) {
      params.placeId = placeId;
    },
    _.bind(this.ensureAttendees, this, params.attendees),
    function (attendeeIds) {
      _.forEach(params.attendees, function (attendee, i) {
        attendee.id = attendeeIds[i];
      });
    },
    _.bind(this.createEvent, this, params),
    _.bind(this.addAttendees, this, params.attendees),
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
      res.error(e);
    }, this)
  );
};

EventSaver.prototype.saveTransaction = function (tx) {
  this.tx = tx;
};

EventSaver.prototype.endTransaction = function () {
  db.endTransaction(this.tx);  
};

EventSaver.prototype.ensurePlace = function (place) {
  if (place.id) {
    return db.runQueryInTransaction(      
      findPlaceById(place),
      this.tx
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
      saveThing(_.extend({type_id: 3, link: ""}, place)),
      this.tx
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

EventSaver.prototype.ensureAttendees = function (attendees) {
  return when.all(_.map(attendees, _.bind(this.ensureAttendee, this)));
};

EventSaver.prototype.ensureAttendee = function (attendee) {
  try {
    if (attendee.id !== -1) {
      return db.runQueryInTransaction(      
        findThingById(attendee),
        this.tx
      ).then(
        function (result) {
          if (result.rows.length === 0) {
            winston.error("tried to find a thing that can't be found", attendee);
            throw {
              message: "no place found with id: " + attendee.id
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
      attendee.name = attendee.text;
      return db.runQueryInTransaction(
        saveThing(_.extend({type_id: 1, link: ""}, attendee)),
        this.tx
      ).then(
        function (result) {
          if (result.rows === 0) {
            winston.error("tried to create a thing but failed", attendee);
            throw {
              message: "tried to create a thing but failed " +  JSON.stringify(attendee)
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
    winston.error("error while validating attendee");
    winston.error(e);
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
    return db.runQueryInTransaction(      
      saveEvent(event),
      this.tx
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

EventSaver.prototype.addAttendees = function (attendees, eventId) {
  return when.map(attendees, _.bind(this.addAttendee, this, eventId));
};

EventSaver.prototype.addAttendee = function (eventId, attendee) {
  return db.runQueryInTransaction(      
    saveEventParticipant({
      attendee_id: attendee.id,
      event_id: eventId
    }),
    this.tx
  ).then(
    function (result) {
      return result.rowCount === 1;
    }, 
    function (e) {
      winston.error("failed to add attendee /event");
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