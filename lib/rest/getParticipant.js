var db = require("../db");
var winston = require("winston");

module.exports = {
  init: function (app) {
    app.get("/participant", function (req, res) {
      var params = req.query;
      var query = params.q.replace(" ", "%");
      db.runQuery(
        "get_participants",
        [query]
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