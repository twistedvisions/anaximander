var _ = require("underscore");
var getEvent = require("./util/getEvent");

module.exports = {

  init: function (app) {
    app.get("/event/:id", _.bind(this.getEvent, this));
  },

  getEvent: function (req, res, next) {
    var id = req.param("id");
    getEvent(id).then(
      function (event) {
        res.send(event);
      },
      next
    );
  }
};
