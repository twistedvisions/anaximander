var _ = require("underscore"),
    utils = require("../utils"),
    db = require("../../db");

var thingInsert = _.template(
  "INSERT INTO thing (name, type_id, link) " +
  "VALUES ('<%= name %>', <%= type_id %>, '<%= link %>') " +
  "RETURNING id"
);

var thingTypes = {
  "person": 1,
  "organisation": 2
};

var addThing = function (job, type) {
  
  var name = utils.extractName(job.key);
  var insert = thingInsert({
    name: name,
    link: utils.escapeQuote(job.link),
    type_id: thingTypes[type]
  });
  job.log(insert);
  return db.runQuery(insert).then(function (result) {
    job.log("got id? ");
    try {
      job.value.id = result.rows[0].id;
      job.log("" + job.value.id);
    } catch (e) {
      job.log(e.message);
    }
  });
};

var createThing = function (job, type) {
  job.key = unescape(job.data.key);
  job.link = unescape(job.data.link);
  return addThing(job, type);
};

module.exports = createThing;