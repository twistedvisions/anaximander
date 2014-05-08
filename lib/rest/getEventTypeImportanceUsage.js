var db = require("../db");

module.exports = {
  init: function (app) {
    app.get("/event_types/:id/importance/usage", function (req, res, next) {
      db.runQuery(
        "get_event_type_importance_usage", [req.param("id")]
      ).then(
        function (result) {
          res.send(result.rows);
        },
        next
      );
    });
  }
};
