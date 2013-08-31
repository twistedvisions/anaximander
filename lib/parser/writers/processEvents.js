var when = require("when"),
    sequence = require("when/sequence"),
    guard = require("when/guard"),
    _ = require("underscore"),
    utils = require("../utils"),
    config = require("../config"),
    addPerson = require("./addPerson");

var events = ["birth", "death", "foundation", "battle"];
var eventProcessors = _.map(events, function (event) {
  return require("./events/" + event);
});

var processEvents = function (job) {
  try {

    var name = utils.extractName(job.key);
    
    var events = _(eventProcessors)
      .filter(function (processor) {
        return processor.shouldProcess(job.value);
      })
      .map(function (processor) {
        return processor.process(name, job);
      });

    return when.all(events);
  } catch (e) {
    console.log(e);
    job.log(e);
  }
};

module.exports = function (job) {

  var d = when.defer();

  job.value = JSON.parse(unescape(job.data.value));

  job.key = unescape(job.data.key);
  job.link = unescape(job.data.link);
  return sequence(
    [addPerson, processEvents],
    job
  );
};
