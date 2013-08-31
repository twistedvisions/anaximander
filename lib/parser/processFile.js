
var when = require("when"),
    _ = require("lodash"),
    lazy = require("lazy"),
    fs  = require("fs"),
    kue = require("kue"),
    humanize = require("humanize");

var interestingTypes = require("./config").interesting_types;

var getInterestingTypes = function () {
  return _.map(_.values(interestingTypes), function (obj) {
    return _.keys(obj).join("|");
  }).join("|");
};

var interestingLinesRegExp = new RegExp(getInterestingTypes());

var interestingLines = function (line) {
  return interestingLinesRegExp.test(line);
};

var extractLink = function (str) {
  return (/<(.*)\?.*>/).exec(str)[1];
};

var key;
var data;
var jobs;

var enqueueData = function () {
  data.value = escape(JSON.stringify(data.value));
  jobs.create("process_place", data).priority("high").save();
  jobs.create("process_person", data).save();
};

var processLine = function (line) {
  var tokens = line.split(" ");
  var thing = tokens[0];
  var type = tokens[1];
  var value = tokens[2];
  var wikipage = tokens[3];
  
  if (type in interestingTypes.position) {

    value = value.split("\"")[1];
 
  } else if (type in interestingTypes.places) {
 
    value = value;
 
  } else if (type in interestingTypes.dates) {
 
    value = value.split("\"")[1];
 
  } else if (type in interestingTypes.years) {
 
    value = value.split("\"")[1];

  }

  if (thing !== key) {
    
    if (key !== null) {
      enqueueData();
    }

    key = thing;
    data = {
      key: escape(key),
      title: escape(key),
      link: extractLink(wikipage),
      value: {}
    };

  }

  data.value[type] = data.value[type] || [];
  data.value[type].push(value);
};

var processFile = function (file, n) {
  data = {};
  key = null;
  jobs = kue.createQueue();
  var d = when.defer();
  var processor = new lazy(fs.createReadStream(file))

    .lines
    .skip(1)
    .take(n)
    .map(String)
    .filter(interestingLines)
    .forEach(processLine)
    .on("pipe", function () {
      enqueueData();
      d.resolve();
    });

  return d.promise;
};

module.exports = processFile;
