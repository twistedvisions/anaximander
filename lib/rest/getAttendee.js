var _ = require("underscore");
var fs = require("fs");
var db = require("../db");
var winston = require("winston");

var getAttendees = _.template(fs.readFileSync("db_templates/get_attendees.sql").toString());

module.exports = {
  init: function (app) {
    app.get("/attendee", function (req, res) {
      var params = req.query;
      db.runQuery(
        getAttendees({query: params.q})
      ).then(
        function (result) {
          res.send(result.rows);
        }, 
        function () {
          winston.error("failed to process /attendee request", arguments);
        }
      );
    });
  }
};