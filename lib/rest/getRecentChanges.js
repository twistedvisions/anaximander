var db = require("../db");
var winston = require("winston");
//todo: zip up responses
module.exports = {
  init: function (app) {
    app.get("/change/recent", function (req, res) {
      db.runQuery(
        "get_recent_changes",
        []
      ).then(
        function (result) {
          res.send(result.rows);
        },
        function () {
          winston.error("failed to process /participant request", arguments);
        }
      );
    });
  }
};
