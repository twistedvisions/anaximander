var db = require("../db");
var winston = require("winston");

var processChanges = require("./util/processChanges");

module.exports = {
  init: function (app) {
    app.get("/change/recent", function (req, res) {
      db.runQuery(
        "get_recent_changes",
        []
      ).then(
        function (result) {
          processChanges.processChanges(result.rows).then(function (changes) {
            res.send(changes);
          });
        },
        function () {
          winston.error("failed to process /participant request", arguments);
        }
      );
    });
  }
};
