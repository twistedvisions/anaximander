var _ = require("underscore"),
    winston = require("winston"),
    when = require("when"),
    db = require("../raw_db"),
    utils = require("../utils"),
    getPlace = require("./getPlace");

var typeIdMap = {
  "battle": 5,
  "birth": 6,
  "construction closing": 7,
  "construction commencement": 8,
  "construction opening": 9,
  "death": 10,
  "organisation extinction": 11,
  "organisation foundation": 12,
  "place dissolution": 13,
  "place foundation": 14
};

var importanceIdMap = {
  "battle": 1,
  "birth": 2,
  "construction closing": 3,
  "construction commencement": 4,
  "construction opening": 5,
  "death": 6,
  "organisation extinction": 7,
  "organisation foundation": 8,
  "place dissolution": 9,
  "place foundation": 10
};

var findEvent = _.template(
  "SELECT id " +
  "FROM event " +
  "WHERE name = '<%= name %>' "
);

var eventInsert = _.template(
  "INSERT INTO event (name, place_id, start_date, end_date, link, type_id, importance_id, creator_id) " +
  "VALUES ('<%= name %>', <%= place_id %>, " +
  "'<%= start_date %>', '<%= end_date %>', " +
  "'<%= link %>', <%= type_id %>, <%= importance_id %>, 1) " +
  "RETURNING id"
);
var eventParticipantInsert = _.template(
  "INSERT INTO event_participant (thing_id, event_id, role_id, importance_id, creator_id) " +
  "VALUES (<%= thing_id %>, <%= event_id %>, 15, 11, 1)"
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

var ifEventDoesntExist = function (name) {
  var d = when.defer();
  var query = findEvent({
    name: name
  });
  db.runQuery(query).then(function (result) {
    d.resolve(result.rows.length === 0);
  });
  return d.promise;
};

var addEvent = function (name, job, eventName, eventType, placeId, dateKeys) {
  var d = when.defer();
  try {
    job.log("adding event");
    var entireName = name + " " + eventName;
    ifEventDoesntExist(entireName).then(function (ok) {
      if (!ok) {
        d.resolve();
      } else {
        var date = getDate(job.value, dateKeys);
        var insert = eventInsert({
          name: entireName,
          place_id: placeId,
          start_date: combineDateTime(date, "00:00"),
          end_date: combineDateTime(date, "23:59"),
          link: utils.escapeQuote(job.link),
          type_id: typeIdMap[eventType],
          importance_id: importanceIdMap[eventType]
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
            db.runQuery(insert).then(
              function () {
                job.log("added event participant");
                d.resolve();
              },
              function (e) {
                job.log("failed event participant");
                job.log(e);
                winston.error("Could not add event participant",
                  utils.getError(e, job));
                d.reject(e);
              });
          } else {
            d.reject("no thing or place");
          }
        }, function () {
          winston.error("insert failed");
          d.resolve();
        });
      }
    });
  } catch (e) {
    winston.error("Could not add event", utils.getError(e, job));
    job.log("failed to add event");
    job.log(JSON.stringify(e));
    d.reject(e);
  }
  return d.promise;
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

var addEventWithPlace = function (name, job, eventName, eventType, placeKeys, dateKeys) {

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
        return addEvent(name, job, eventName, eventType, placeId, dateKeys);
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