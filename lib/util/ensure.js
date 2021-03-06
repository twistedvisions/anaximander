var _ = require("underscore");

module.exports = {
  "float": function (x) {
    var f = parseFloat(x);
    if (f.toString() !== x.toString()) {
      throw new Error(x.toString() + "does not parse as a float");
    }
    return f;
  },
  intArray: function (array) {
    if (_.any(array, function (x) {
      return parseInt(x, 10).toString() !== x.toString();
    })) {
      throw new Error(JSON.stringify(array) + "does not parse as an int array");
    }
    return array;
  }
};