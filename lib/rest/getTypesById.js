var db = require("../db");
var winston = require("winston");
var typeGrouper = require("./util/TypeGrouper");

module.exports = function (typeId) {
  return function (req, res) {
    db.runQuery("get_types_by_type_id", [typeId]).then(
      typeGrouper(res),
      function () {
        winston.error("failed to process getTypesById(" + typeId + ") request", arguments);
      }
    );
  };
};
