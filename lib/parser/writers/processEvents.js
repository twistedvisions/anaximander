var when = require("when"),
    sequence = require("when/sequence"),
    _ = require("underscore"),
    utils = require("../utils"),
    addPerson = require("./addPerson"),
    addOrganisation = require("./addOrganisation");

var events = [
  "birth", "death", 
  "placeFoundation", "placeDissolution", 
  "organisationFoundation", "organisationExtinction", 
  "battle"
];
  
var eventProcessors = _.map(events, function (event) {
  return require("./events/" + event);
});

var processEvents = function (job) {
  try {

    var name = utils.extractName(job.key);
    
    var events = _(eventProcessors)
      .filter(function (processor) {
        
        var isOfType = processor.shouldProcess(job.value);
        job.log("is a " + processor.name + "? " + isOfType);
        return isOfType;
      })
      .map(function (processor) {
        job.log("Processing event: " + name);
        return processor.process(name, job);
      });

    return when.all(events);
  } catch (e) {
    job.log(e);
  }
};

module.exports = function (job) {

  var d = when.defer();

  job.value = JSON.parse(unescape(job.data.value));

  job.key = unescape(job.data.key);
  job.link = unescape(job.data.link);
  return sequence(
    [addPerson, addOrganisation, processEvents],
    job
  );
};
