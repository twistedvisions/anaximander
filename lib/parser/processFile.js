
var when = require("when"),
    _ = require("lodash"),
    lazy = require("lazy"),
    fs  = require("fs"),
    kue = require("kue"),
    humanize = require("humanize"),
    nconf = require("../config"),
    utils = require("./utils");

var interestingTypes = nconf.parser.interesting_types;

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
  try {
    return (/<(.*)\?.*>/).exec(str)[1];
  } catch (e) {
    console.log("failed to extract link from", str);
    throw e;
  }
};

var key;
var data;
var jobs;
var isPlace;

var enqueueData = function (isPlace) {
  data.value = escape(JSON.stringify(data.value));
  if (isPlace) {
    jobs.create("process_place", data).priority("high").save();
  }
  jobs.create("process_event", data).save();
};

var processLine = function (line) {
  line = utils.tidyLine(line);
  var tokens = line.split(" ");
  var thing = tokens[0];
  var type = tokens[1];
  var value = tokens[2];
  var wikipage = tokens[3];
  var isCurrentPlace = false;
  
  if (type in interestingTypes.position) {

    value = value.split("\"")[1];
    isCurrentPlace = true;
 
  } else if (type in interestingTypes.places) {
 
    value = value;
 
  } else if (type in interestingTypes.dates) {
 
    value = value.split("\"")[1];
 
  } else if (type in interestingTypes.years) {
 
    value = value.split("\"")[1];

  }

  if (thing !== key) {
    
    if (key !== null) {
      enqueueData(isPlace);
    }

    key = thing;
    data = {
      key: escape(key),
      title: escape(key),
      link: extractLink(wikipage),
      value: {}
    };
    isPlace = false;

  }

  isPlace = isCurrentPlace;

  data.value[type] = data.value[type] || [];
  data.value[type].push(value);
};

var processFile = function (file, n) {
  data = {};
  key = null;
  isPlace = false;
  jobs = kue.createQueue();
  var d = when.defer();
  var processor = new lazy(fs.createReadStream(file))

    .lines
    .skip(1);
  if (n) {
    processor = processor.take(n);
  }
  processor = processor
    .map(String)
    .filter(interestingLines)
    .forEach(processLine)
    .on("pipe", function () {
      enqueueData(isPlace);
      d.resolve();
    });

  return d.promise;
};

module.exports = processFile;
