var sortBy = (function () {

  // utility functions
  var defaultComparator, getComparator;

  defaultComparator = function (a, b) {
    if (a == b) {
      return 0;
    }
    return a < b ? -1 : 1;
  };

  getComparator = function (primer, reverse) {

    var dfc = defaultComparator, // closer in scope
        cmp = defaultComparator;

    if (primer) {

      cmp = function (a, b) {
        return dfc(primer(a), primer(b));
      };

    }

    if (reverse) {
      return function (a, b) {
        return -1 * cmp(a, b);
      };
    }

    return cmp;
  };

  // actual implementation
  return function () {

    var fields = [],
      fieldLength = arguments.length,
      field, name, cmp;

    // preprocess sorting options
    for (var i = 0; i < fieldLength; i += 1) {

      field = arguments[i];

      if (typeof field === "string") {

        name = field;
        cmp = defaultComparator;

      } else {

        name = field.name;
        cmp = getComparator(field.primer, field.reverse);

      }

      fields.push({
        name: name,
        cmp: cmp
      });

    }

    // final comparison function
    return function (a, b) {

      var name, result;

      for (var i = 0; i < fieldLength; i += 1) {

        result = 0;
        field = fields[i];
        name = field.name;

        result = field.cmp(a[name], b[name]);

        if (result !== 0) {
          break;
        }

      }

      return result;
    };
  };
})();

module.exports = sortBy;