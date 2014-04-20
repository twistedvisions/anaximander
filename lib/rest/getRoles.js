var getTypesById = require("./getTypesById");

module.exports = {
  init: function (app) {
    app.get("/role", getTypesById(3));
  }
};
