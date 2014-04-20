var getTypesById = require("./getTypesById");

module.exports = {
  init: function (app) {
    app.get("/event_type", getTypesById(2));
  }
};
