var _ = require("underscore"),
    db = require("../../db"),
    utils = require("../utils");

var eventInsert = _.template(
  "INSERT INTO event (name, place_id, start_date, end_date, attendee_count) " +
  "VALUES ('<%= name %>', <%= place_id %>, " +
  "'<%= start_date %>', '<%= end_date %>', " +
  "<%= attendee_count %>) " +
  "RETURNING id"
);
var eventAttendeeInsert = _.template(
  "INSERT INTO event_attendee (person_id, event_id) " +
  "VALUES (<%= person_id %>, <%= event_id %>)"
);

var getDate = function (value, keys) {
  var key = _.find(keys, function (key) {
    return value[key] && value[key][0];
  });
  var date = value[key][0].value;
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

var addEvent = function (name, value, eventName, placeId, dateKeys) {

  var date = getDate(value, dateKeys);
  var insert = eventInsert({
    name: utils.escapeQuote(name + " " + eventName), 
    place_id: placeId,
    start_date: combineDateTime(date, "00:00"),
    end_date: combineDateTime(date, "23:59"),
    attendee_count: 1
  });
  
  return db.runQuery(insert).then(function (result) {
    var eventId = result.rows[0].id;
    var insert = eventAttendeeInsert({
      person_id: value.id,
      event_id: eventId
    });
    return db.runQuery(insert);
  });
};

module.exports = {
  getDate: getDate,
  combineDateTime: combineDateTime,
  addEvent: addEvent
};