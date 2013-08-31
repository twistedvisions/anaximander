var _ = require("underscore"),
    utils = require("../utils"),
    db = require("../../db"),
    birth = require("./events/birth"),
    death = require("./events/death");

var personInsert = _.template(
  "INSERT INTO person (name, link) " +
  "VALUES ('<%= name %>', '<%= link %>') " +
  "RETURNING id"
);

var addPerson = function (job) {
  
  var name = utils.extractName(job.key);
  var insert = personInsert({
    name: name,
    link: utils.escapeQuote(job.link)
  });
  job.log(insert);
  return db.runQuery(insert).then(function (result) {
    job.log("got id? ");
    try {
      job.value.id = result.rows[0].id;
    } catch (e) {
      job.log(e.message);
    }
  });
};

var createPerson = function (job) {
  var shouldProcess = birth.shouldProcess(job.value) || 
    death.shouldProcess(job.value);
  job.log("should create person? " + !!shouldProcess);
  if (shouldProcess) {
    job.key = unescape(job.data.key);
    job.link = unescape(job.data.link);
    return addPerson(job);
  } 
};

module.exports = createPerson;