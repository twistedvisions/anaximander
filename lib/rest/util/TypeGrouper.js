var _ = require("underscore");

module.exports = function (res) {
  return function (result) {

    var data = _.groupBy(result.rows, "id");
    data = _.map(data, function (value) {
      var obj = _.pick(value[0], ["id", "name", "default_importance_id"]);
      obj.importances = _.map(value, function (importance) {
        return {
          id: importance.importance_id,
          name: importance.importance_name
        };
      });

      return obj;
    });
    res.send(data);
  };
};
