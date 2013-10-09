var _ = require("underscore"),
    utils = require("../utils"),
    db = require("../../db"),
    addSubType = require("./addSubType"),
    when = require("when"),
    guard = require("when/guard");

var thingInsert = _.template(
  "INSERT INTO thing (name, type_id, link) " +
  "VALUES ('<%= name %>', <%= type_id %>, '<%= link %>') " +
  "RETURNING id"
);

var addThing = function (job, typeId, subTypes) {
  
  var name = utils.extractName(job.key);
  var insert = thingInsert({
    name: name,
    link: utils.escapeQuote(job.link),
    type_id: typeId
  });
  job.log(insert);

  var deferred = when.defer();
  db.runQuery(insert).then(
    function (result) {
      job.log("got id? ");
      try {
        var thingId = result.rows[0].id;
        job.value.id = thingId;
        job.log("" + job.value.id);
        when.all(
          when.map(subTypes, guard(guard.n(1), function (subTypeId) {
            return addSubType(job, job.value.id, subTypeId);
          }))
          .then(function () {
            deferred.resolve(thingId);
          })
          .otherwise(function (err) {
            job.log("err" + JSON.stringify(err));
            deferred.reject(err); 
          })
        );
        
      } catch (e) {
        deferred.reject(e);
      }
    },
    function (e) {
      deferred.reject(e);
    });
  return deferred.promise;
};

var createThing = function (job, typeId, subTypes) {
  job.key = unescape(job.data.key);
  job.link = unescape(job.data.link);
  return addThing(job, typeId, subTypes);
};

module.exports = createThing;