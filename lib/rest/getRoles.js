var db = require("../db");
var winston = require("winston");

module.exports = {
  init: function (app) {
    app.get("/role", function (req, res) {
      db.runQuery("get_roles").then(
        function (result) {
          res.send(result.rows);
        },
        function () {
          winston.error("failed to process /role request", arguments);
        }
      );
    });
  }
};
