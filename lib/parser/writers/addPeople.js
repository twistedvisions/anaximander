var when = require("when"),
    guard = require('when/guard'),
    _ = require("underscore"),
    db = require("../../db"),
    utils = require("../utils"),
    config = require("../config");

module.exports = function (data) {

  var personInsert = _.template(
    "INSERT INTO person (name, link) " +
    "VALUES ('<%= name %>', '<%= link %>') " +
    "RETURNING id"
  );

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

  var getPlaceId = function (name) {
    return data[name] ? data[name].id : null;
  };

  var addPerson = function (key, value) {

    var name = utils.extractName(key);
    var insert = personInsert({
      name: name,
      link: utils.escapeQuote(value["<http://dbpedia.org/ontology/birthDate>"][0].link)
    });

    return db.runQuery(insert).then(function (result) {
      value.id = result.rows[0].id;
      return addBirthday(name, value)
    });
  };

  var addBirthday = function (name, value) {

    var placeId = getPlaceId(value["<http://dbpedia.org/ontology/birthPlace>"][0].value);

    if (placeId) {
      var birthday = value["<http://dbpedia.org/ontology/birthDate>"][0].value;
      var insert = eventInsert({
        name: utils.escapeQuote(name + " born"), 
        place_id: placeId,
        start_date: birthday + " 00:00",
        end_date: birthday + " 23:59",
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

  var counter = 0;

  return when.map(_.pairs(data), guard(guard.n(config.parallelism), function (pair) {

    counter += 1;
    if (counter % 1000 === 0) {
      console.log(counter);
    }

    var key = pair[0];
    var value = pair[1];

    if (value["<http://dbpedia.org/ontology/birthDate>"] &&
        value["<http://dbpedia.org/ontology/birthPlace>"]) {
      return addPerson(key, value);
    }
  })).otherwise(
    function (e) {
      console.log("failed adding people",e);
    }
  );
};
