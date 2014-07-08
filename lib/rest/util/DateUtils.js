var moment = require("moment");

module.exports = {
  formatDate: function (d) {
    var date = moment(d);
    if (date.year() < 1) {
      return date.toISOString().substring(1) + " BC";
    }
    return date.toISOString();
  }
};