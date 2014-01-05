var _ = require("underscore"),
    utils = require("../utils"),
    db = require("../raw_db"),
    addSubType = require("./addSubType"),
    when = require("when"),
    guard = require("when/guard"),
    winston = require("winston");

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
            var d = when.defer();
            addSubType(job, job.value.id, subTypeId)
              .then(function () {
                d.resolve();
              })
              .otherwise(function (e) {
                if (e && e.detail && e.detail.indexOf("already exists") > -1) {
                  d.resolve();
                } else {
                  job.log(JSON.stringify(e));
                  winston.error("Could not add subtype", utils.getError(e, job));
                  d.reject(e);
                }
              });
            return d.promise;
          }))
          .then(function () {
            deferred.resolve(thingId);
          })
          .otherwise(function (e) {
            job.log("err" + JSON.stringify(e));
            winston.error("Could not add subtype to thing", utils.getError(e, job));
            deferred.reject(e);
          })
        );

      } catch (e) {
        winston.error("Could not add thing", utils.getError(e, job));
        deferred.reject(e);
      }
    },
    function (e) {
      winston.error("Could not add thing query", utils.getError(e, job));
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