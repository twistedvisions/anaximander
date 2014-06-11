var typeGrouper = require("./util/TypeGrouper");
var db = require("../db");
var winston = require("winston");

module.exports = {
  init: function (app) {
    app.get("/role", function (req, res) {
      db.runQuery("get_roles", []).then(
        typeGrouper(res),
        function () {
          winston.error("failed to process getRoles request", arguments);
        }
      );
    });
  }
};
