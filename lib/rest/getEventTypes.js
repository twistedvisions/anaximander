var db = require("../db");
var winston = require("winston");

module.exports = {
  init: function (app) {
    app.get("/event_type", function (req, res) {
      db.runQuery("get_event_types").then(
        function (result) {
          res.send(result.rows);
        },
        function () {
          winston.error("failed to process /event_type request", arguments);
        }
      );
    });
  }
};
