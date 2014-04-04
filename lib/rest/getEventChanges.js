var _ = require("underscore");
var winston = require("winston");
var db = require("../db");

module.exports = {

  init: function (app) {
    app.get("/event/:id/change", _.bind(this.getEventChanges, this));
  },

  getEventChanges: function (req, res, next) {
    var id = req.param("id");
    db.runQuery(
      "get_event_changes",
      [id]
    ).then(
      function (result) {
        res.send(result.rows);
      },
      function (e) {
        winston.error("failed to process get event change request", arguments);
        next(e);
      }
    );
  }
};
