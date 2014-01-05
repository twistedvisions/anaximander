var _ = require("underscore"),
    db = require("../raw_db"),
    addSubType = require("./addSubType"),
    guard = require("when/guard");

var thingSubTypeInsert = _.template(
  "INSERT INTO thing_subtype (thing_id, thing_type_id) " +
  "VALUES (<%= thing_id %>, <%= type_id %>) "
);

var addSubType = guard(guard.n(1), function (job, thingId, subTypeId) {
  var insert = thingSubTypeInsert({
    thing_id: thingId,
    type_id: subTypeId
  });
  job.log(insert);
  return db.runQuery(insert);
});

module.exports = addSubType;