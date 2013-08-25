
var when = require("when"),
    _ = require("underscore"),
    lazy = require("lazy"),
    fs  = require("fs");

var humanize = require("humanize"), 
    os = require("os");

var data;

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

  data[thing] = data[thing] || {};
  data[thing][type] = data[thing][type] || [];
  data[thing][type].push({
    value: value
  });
  data[thing].link = extractLink(wikipage);

  if (_.keys(data).length % 2000 === 0) {
    console.log(
      humanize.numberFormat(_.keys(data).length, 0),
      humanize.numberFormat(JSON.stringify(data).length, 0),
      humanize.numberFormat(os.freemem(), 0)
    );
  }

};

var processFile = function (file, n) {
  data = {};
  var d = when.defer();
  var processor = new lazy(fs.createReadStream(file))

    .lines
    .skip(1)
    .take(n)
    .map(String)
    .filter(interestingLines)
    .forEach(processLine)
    .on("pipe", function () {
      d.resolve(data);
    });

  return d.promise;
};

module.exports = processFile;
