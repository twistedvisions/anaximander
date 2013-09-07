var addThing = require("./addThing"),
    organisationFoundation = require("./events/organisationFoundation");

var createOrganisation = function (job) {
  var shouldProcess = organisationFoundation.shouldProcess(job.value);
  job.log("should create organisation? " + !!shouldProcess);
  if (shouldProcess) {
    return addThing(job, "organisation");
  } 
};

module.exports = createOrganisation;
