var _ = require("underscore");
var db = require("../db");

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
  "end_date"
];

var participantKeys = [
  "id",
  "name",
  "type_id",
  "importance_id"
];

module.exports = {

  init: function (app) {
    app.get("/event/:id", _.bind(this.getEvent, this));
  },

  getEvent: function (req, res, next) {
    var id = req.param("id");
    db.runQuery("get_event_by_id", [id]).then(
      _.bind(this.handleGetEvent, this, res, next)
    );
  },

  handleGetEvent: function (res, next, result) {
    var rows = result.rows;
    if (rows.length > 0) {
      var event = _.pick(_.first(rows), eventKeys);
      this.objectifyId(event, "type");
      this.objectifyId(event, "importance");
      this.objectifyId(event, "place", ["id", "name"]);
      event.participants = _.map(rows, this.parseParticipant, this);
      res.send(event);
    } else {
      next(new Error("no result"));
    }
  },

  parseParticipant: function (row) {
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
    this.objectifyId(participant, "type");
    this.objectifyId(participant, "importance");
    return participant;
  },

  objectifyId: function (obj, key, newKeys) {
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
  }
};
