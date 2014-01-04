var _ = require("underscore");
var db = require("../db");
var winston = require("winston");

module.exports = {
  init: function (app) {
    app.get("/type/:id/type", function (req, res) {
      db.runQuery("get_event_subtypes", [req.param("id")]).then(
        function (result) {
          result.rows = _.map(result.rows, function (row) {
            row.parent_type = parseInt(row.parent_type, 10);
            return row;
          });
          res.send(result.rows);
        },
        function () {
          winston.error("failed to process /type/:id/type request", arguments);
        }
      );
    });
  }
};
