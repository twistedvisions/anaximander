var db = require("../db");

module.exports = {
  init: function (app) {
    app.get("/event_type/usage", function (req, res, next) {
      db.runQuery(
        "get_event_type_usage", []
      ).then(
        function (result) {
          res.send(result.rows);
        },
        next
      );
    });
  }
};
