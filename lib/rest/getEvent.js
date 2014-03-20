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
    app.get("/event/:id", this.getEvent);
  },
  getEvent: function (req, res, next) {
    var id = req.param("id");
    db.runQuery("get_event_by_id", [id]).then(_.bind(this.handleGetEvent, res, next));
  },
  handleGetEvent: function (res, next, result) {
    var rows = result.rows;
    if (rows.length > 0) {
      var event = _.pick(_.first(rows), eventKeys);
      event.participants = _.map(rows, function (row) {
        var participant = {};
        _.each(participantKeys, function (key) {
          participant[key] = row["participant_" + key];
        });
        return participant;
      });
      res.send(event);
    } else {
      next(new Error("no result"));
    }
  }
};
