var _ = require("underscore"),
    winston = require("winston"),
    db = require("../../db"),
    utils = require("../utils"),
    getPlace = require("./getPlace");

var eventInsert = _.template(
  "INSERT INTO event (name, place_id, start_date, end_date, attendee_count, link) " +
  "VALUES ('<%= name %>', <%= place_id %>, " +
  "'<%= start_date %>', '<%= end_date %>', " +
  "'<%= link %>') " +
  "RETURNING id"
);
var eventParticipantInsert = _.template(
  "INSERT INTO event_participant (thing_id, event_id) " +
  "VALUES (<%= thing_id %>, <%= event_id %>)"
);

var getDate = function (value, keys) {
  var key = _.find(keys, function (key) {
    return value[key] && value[key][0];
  });
  var date = value[key][0];
  if (date.lastIndexOf("-") <= 0) {
    date = date + "-01-01";
  }
  return date;
};

var combineDateTime = function (date, time) {
  var value = date + " " + time;
  if (value.charAt(0) === "-") {
    value += " BC";
    value = value.substring(1);
  }
  return value;
};

var addEvent = function (name, job, eventName, placeId, dateKeys) {
  try {
    job.log("adding event");
    var date = getDate(job.value, dateKeys);
    var insert = eventInsert({
      name: name + " " + eventName, 
      place_id: placeId,
      start_date: combineDateTime(date, "00:00"),
      end_date: combineDateTime(date, "23:59"),
      link: utils.escapeQuote(job.link)
    });
    job.log(insert);

    return db.runQuery(insert).then(function (result) {
      var eventId = result.rows[0].id;

      job.log("got id " + eventId);
      if (job.value.id || job.value.placeId) {
        var insert = eventParticipantInsert({
          thing_id: job.value.id || job.value.placeId,
          event_id: eventId
        });
        job.log(insert);
        return db.runQuery(insert).then(
          function () {
            job.log("added event participant");
            return true;
          },
          function (e) {
            job.log("failed event participant");
            job.log(e);
            winston.error("Could not add event participant",
              utils.getError(e, job));
            return false;
          });
      } else {
        return null;
      }
    });
  } catch (e) {
    winston.error("Could not add event", utils.getError(e, job));
    job.log("failed to add event");
    job.log(JSON.stringify(e));
    return null;
  }
};

var getGoodPlace = function (job, placeKeys) {
  try {
    var placeKey = _.find(placeKeys, function (key) {
      var place = job.value[key];
      return place && place.length > 0;
    });
    if (placeKey) {
      return job.value[placeKey][0];
    } else {
      return null;
    }
  } catch (e) {
    job.log(JSON.stringify(e));
  }
};

var addEventWithPlace = function (name, job, eventName, placeKeys, dateKeys) {

  var place;
  var isPlace = !placeKeys;
  if (!isPlace) {
    place = getGoodPlace(job, placeKeys);
  } else {
    place = job.key;
  }
  if (place) {
    place = utils.extractName(place);

    job.log("looking for " + place);
    return getPlace.byName(job, place).then(function (placeId) {
      if (placeId) {
        if (isPlace) {
          job.value.id = placeId;
        } 
        //being used by events/battle.js so it doesn't have to do the same lookup
        job.value.placeId = placeId;
        job.log("Found it at " + placeId);
        return addEvent(name, job, eventName, placeId, dateKeys);
      } else {
        winston.verbose("Can't find place, skipping", {value: job.value});
        job.log("Can't find place, skipping");
        return false;
      }
    });
  } else {
    job.log("no place found");
    winston.verbose("no place key for job", job.value);
    return false;
  }
};

module.exports = {
  getDate: getDate,
  combineDateTime: combineDateTime,
  addEvent: addEvent,
  addEventWithPlace: addEventWithPlace
};