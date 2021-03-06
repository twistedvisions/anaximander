var _ = require("underscore");
var getEvent = require("./util/GetEvent");

module.exports = {

  init: function (app) {
    app.get("/event/:id", _.bind(this.getEvent, this));
  },

  getEvent: function (req, res, next) {
    var id = req.param("id");
    getEvent(id).then(
      function (event) {
        event.location = JSON.parse(event.location);
        res.send(event);
      },
      next
    );
  }
};
