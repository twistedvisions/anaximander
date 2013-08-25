var _ = require("underscore"),
    db = require("../../db"),
    utils = require("../utils");

var getPlaceId = function (data, name) {
  return data[name] ? data[name].id : null;
};

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

var addEvent = function (data, name, value, eventName, placeKey, dateKey) {

  var placeId = getPlaceId(data, value[placeKey][0].value);

  if (placeId) {
    var date = value[dateKey][0].value;
    var insert = eventInsert({
      name: utils.escapeQuote(name + " " + eventName), 
      place_id: placeId,
      start_date: date + " 00:00",
      end_date: date + " 23:59",
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
  }
};

module.exports = {
  addEvent: addEvent
};