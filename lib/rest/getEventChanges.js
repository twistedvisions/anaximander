var _ = require("underscore");
var winston = require("winston");
var db = require("../db");

var processChanges = require("./util/processChanges");

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
        processChanges.processChanges(result.rows).then(function (changes) {
          res.send(changes);
        });
      },
      function (e) {
        winston.error("failed to process get event change request", arguments);
        next(e);
      }
    );
  }
};
