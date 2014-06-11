var _ = require("underscore");

module.exports = function (res) {

  var typeKeys = ["id", "last_edited", "name", "default_importance_id", "related_type"];
  var importanceKeys = ["importance_id", "importance_last_edited", "importance_name", "importance_description", "importance_value"];

  return function (result) {

    var data = _.groupBy(result.rows, "id");
    data = _.map(data, function (value) {
      var obj = _.pick(value[0], typeKeys);
      obj.importances = _.map(value, function (importance) {
        importance = _.pick(importance, importanceKeys);
        return _.reduce(importanceKeys, function (memo, key) {
          memo[key.substring(11)] = importance[key];
          return memo;
        }, {});
      });

      return obj;
    });
    data = _.sortBy(data, function (el) {
      return el.related_type + el.name;
    });
    res.send(data);
  };
};
