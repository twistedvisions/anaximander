var _ = require("underscore");
var winston = require("winston");
var db = require("../db");

var processChanges = require("./util/processChanges");

module.exports = {

  init: function (app) {
    app.get("/thing/:id/change", _.bind(this.getThingChanges, this));
  },

  getThingChanges: function (req, res, next) {
    var id = req.param("id");
    db.runQuery(
      "get_thing_changes",
      [id]
    ).then(
      function (result) {
        processChanges.processChanges(result.rows).then(function (changes) {
          res.send(changes);
        });
      },
      function (e) {
        winston.error("failed to process get thing change request", arguments);
        next(e);
      }
    );
  }
};
