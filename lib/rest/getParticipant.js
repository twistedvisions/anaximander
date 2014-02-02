var db = require("../db");
var winston = require("winston");

module.exports = {
  init: function (app) {
    app.get("/participant", function (req, res) {
      var params = req.query;
      db.runQuery(
        "get_participants",
        [params.q]
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