var _ = require("underscore");
var fs = require("fs");
var db = require("../db");
var winston = require("winston");

var getEventTypes = _.template(fs.readFileSync("db_templates/get_event_types.sql").toString());

module.exports = {
  init: function (app) {
    app.get("/type", function (req, res) {
      db.runQuery(
        getEventTypes({})
      ).then(
        function (result) {
          res.send(result.rows);
        }, 
        function () {
          winston.error("failed to process /type request", arguments);
        }
      );
    });
  }
};
