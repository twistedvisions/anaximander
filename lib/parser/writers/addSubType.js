var _ = require("underscore"),
    db = require("../../db"),
    addSubType = require("./addSubType");

var thingSubTypeInsert = _.template(
  "INSERT INTO thing_subtype (thing_id, thing_type_id) " +
  "VALUES (<%= thing_id %>, <%= type_id %>) "
);

var addSubType = function (job, thingId, subTypeId) {
  var insert = thingSubTypeInsert({
    thing_id: thingId,
    type_id: subTypeId
  });
  job.log(insert);
  return db.runQuery(insert);
};

module.exports = addSubType;