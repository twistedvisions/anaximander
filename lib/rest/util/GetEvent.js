var _ = require("underscore");
var when = require("when");
var db = require("../../db");

var eventKeys = [
  "id",
  "name",
  "place_id",
  "place_name",
  "location",
  "type_id",
  "importance_id",
  "link",
  "start_date",
  "start_offset_seconds",
  "end_date",
  "end_offset_seconds"
];

var participantKeys = [
  "id",
  "name",
  "type_id",
  "importance_id"
];

var objectifyId = function (obj, key, newKeys) {
  if (!newKeys) {
    newKeys = ["id"];
  }
  if (!obj[key]) {
    obj[key] = {};
  }
  _.forEach(newKeys, function (newKey) {
    var suffix = "_" + newKey;
    var oldKey = key + suffix;
    obj[key][newKey] = obj[oldKey];
    delete obj[oldKey];
  });
  return obj;
};

var parseParticipant = function (row) {
  var participant = {};
  _.each(participantKeys, function (key) {
    participant[key] = row["participant_" + key];
  }, this);
  participant.thing = {
    id: participant.id,
    name: participant.name
  };
  delete participant.id;
  delete participant.name;
  objectifyId(participant, "type");
  objectifyId(participant, "importance");
  return participant;
};


var handleGetEvent = function (rows) {
  var row = _.first(rows);
  var event = _.pick(row, eventKeys);

  event.end_date.setTime(event.end_date.getTime() - event.end_date.getTimezoneOffset() * 60 * 1000);
  event.start_date.setTime(event.start_date.getTime() - event.start_date.getTimezoneOffset() * 60 * 1000);

  objectifyId(event, "type");
  objectifyId(event, "importance");
  objectifyId(event, "place", ["id", "name"]);
  event.participants = _.map(rows, parseParticipant, this);
  return event;
};

var getEvent = function (id) {
  var d = when.defer();
  db.runQuery("get_event_by_id", [id]).then(
    _.bind(function (result) {
      var rows = result.rows;
      if (rows.length > 0) {
        d.resolve(handleGetEvent(rows));
      } else {
        d.reject(new Error("no result"));
      }
    }, this),
    d.reject
  );
  return d.promise;
};

module.exports = getEvent;
getEvent.handleGetEvent = handleGetEvent;