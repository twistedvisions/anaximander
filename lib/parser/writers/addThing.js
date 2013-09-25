var _ = require("underscore"),
    utils = require("../utils"),
    db = require("../../db"),
    when = require("when");

var thingInsert = _.template(
  "INSERT INTO thing (name, type_id, link) " +
  "VALUES ('<%= name %>', <%= type_id %>, '<%= link %>') " +
  "RETURNING id"
);

var thingSubTypeInsert = _.template(
  "INSERT INTO thing_subtype (thing_id, thing_type_id) " +
  "VALUES (<%= thing_id %>, <%= type_id %>) "
);

var thingTypes = {
  "person": 1,
  "organisation": 2,
  "place": 3,
  "construction": 4
};

var addThing = function (job, type, subTypes) {
  
  var name = utils.extractName(job.key);
  var insert = thingInsert({
    name: name,
    link: utils.escapeQuote(job.link),
    type_id: thingTypes[type]
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
        when.all(_.map(subTypes, function (subType) {
          return db.runQuery(thingSubTypeInsert({
            thing_id: job.value.id,
            type_id: subType
          })).otherwise(
            function (err) {
              job.log("err" + JSON.stringify(err));
              deferred.reject(err); 
            });
        })).then(function () {
          deferred.resolve(thingId);
        });
        
      } catch (e) {
        deferred.reject(e);
      }
    },
    function (e) {
      deferred.reject(e);
    });
  return deferred.promise;
};

var createThing = function (job, type, subTypes) {
  job.key = unescape(job.data.key);
  job.link = unescape(job.data.link);
  return addThing(job, type, subTypes);
};

module.exports = createThing;