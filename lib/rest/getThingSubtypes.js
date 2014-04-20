var db = require("../db");
var winston = require("winston");
var typeGrouper = require("./util/TypeGrouper");

module.exports = {
  init: function (app) {
    app.get("/type/:id/type", function (req, res) {
      db.runQuery("get_thing_subtypes", [req.param("id")]).then(
        typeGrouper(res),
        function () {
          winston.error("failed to process /type/:id/type request", arguments);
        }
      );
    });
  }
};
