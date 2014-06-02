var db = require("../db");
var winston = require("winston");
var typeGrouper = require("./util/TypeGrouper");

module.exports = {
  init: function (app) {
    app.get("/role/:relatedTypeId", function (req, res) {
      var relatedTypeId = req.param("relatedTypeId");
      db.runQuery("get_roles_by_related_type_id", [relatedTypeId]).then(
        typeGrouper(res),
        function () {
          winston.error("failed to process getRoles request", arguments);
        }
      );
    });
  }
};
