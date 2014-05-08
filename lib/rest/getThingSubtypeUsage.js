var db = require("../db");

module.exports = {
  init: function (app) {
    app.get("/type/:id/type/usage", function (req, res, next) {
      db.runQuery(
        "get_thing_subtype_usage", [req.param("id")]
      ).then(
        function (result) {
          res.send(result.rows);
        },
        next
      );
    });
  }
};
