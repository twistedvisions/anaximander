var db = require("../db");
var winston = require("winston");

module.exports = {
  init: function (app) {
    app.get("/attendee", function (req, res) {
      var params = req.query;
      db.runQuery(
        "get_attendees",
        [params.q]
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