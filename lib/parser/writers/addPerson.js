var addThing = require("./addThing"),
    birth = require("./events/birth"),
    death = require("./events/death");

var createPerson = function (job) {
  var shouldProcess = birth.shouldProcess(job.value) || 
    death.shouldProcess(job.value);
  job.log("should create person? " + !!shouldProcess);
  if (shouldProcess) {
    return addThing(job, "person");
  } 
};

module.exports = createPerson;