var db = require("../db");

module.exports = {
  init: function (app) {
    app.get("/role/usage", function (req, res, next) {
      db.runQuery(
        "get_role_usage", []
      ).then(
        function (result) {
          res.send(result.rows);
        },
        next
      );
    });
  }
};
