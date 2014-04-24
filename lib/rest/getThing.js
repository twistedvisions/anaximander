var _ = require("underscore");
var db = require("../db");

module.exports = {

  init: function (app) {
    app.get("/thing/:id", _.bind(this.getThing, this));
  },

  getThingObj: function (rows) {
    var thing = _.pick(rows[0], ["id", "name", "link", "type_id"]);
    if (rows[0].thing_type_id) {
      thing.subtypes = _.map(rows, function (row) {
        return {
          type: {
            id: row.thing_type_id
          },
          importance: {
            id: row.importance_id
          }
        };
      });
    } else {
      thing.subtypes = [];
    }
    return thing;
  },

  getThing: function (req, res, next) {
    var id = req.param("id");
    db.runQuery("get_thing_by_id", [id]).then(
      _.bind(function (result) {
        var rows = result.rows;
        if (rows.length > 0) {
          res.send(this.getThingObj(rows));
        } else {
          next(new Error("no result"));
        }
      }, this),
      next
    );
  }
};
