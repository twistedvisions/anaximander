var db = require("../db");

module.exports = {
  init: function (app) {
    app.get("/role/:id/importance/usage", function (req, res, next) {
      db.runQuery(
        "get_role_importance_usage", [req.param("id")]
      ).then(
        function (result) {
          res.send(result.rows);
        },
        next
      );
    });
  }
};
