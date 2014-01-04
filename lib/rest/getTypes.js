var db = require("../db");
var winston = require("winston");

module.exports = {
  init: function (app) {
    app.get("/type", function (req, res) {
      db.runQuery("get_event_types").then(
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
