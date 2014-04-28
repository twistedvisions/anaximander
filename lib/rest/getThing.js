var _ = require("underscore");
var getThing = require("./util/GetThing");

module.exports = {

  init: function (app) {
    app.get("/thing/:id", _.bind(this.getThing, this));
  },

  getThing: function (req, res, next) {
    var id = req.param("id");
    getThing(id).then(
      function (thing) {
        res.send(thing);
      },
      next
    );
  }
};
