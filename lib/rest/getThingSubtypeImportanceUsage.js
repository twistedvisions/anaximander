var db = require("../db");

module.exports = {
  init: function (app) {
    app.get("/type/:type_id/type/:importance_id/importance/usage", function (req, res, next) {
      db.runQuery(
        "get_thing_subtype_importance_usage", [req.param("importance_id")]
      ).then(
        function (result) {
          res.send(result.rows);
        },
        next
      );
    });
  }
};
