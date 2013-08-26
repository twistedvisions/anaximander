
var when = require("when"),
    _ = require("lodash"),
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

var count = 0;
var startTime = new Date().getTime();
var blockStartTime = new Date().getTime();

var dataObjs = [];

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

  if (!data[thing].link) {
    data[thing].link = extractLink(wikipage);
  }

  count += 1;

  if (_.keys(data).length % 2000 === 0) {
    var keys = _.keys(data).length;
    var elapsed = new Date().getTime() - startTime;
    var blockElapsed = new Date().getTime() - blockStartTime;
    console.log(
      humanize.numberFormat(elapsed/1000, 0),
      "-",
      humanize.numberFormat(keys, 0),
      humanize.numberFormat(keys/blockElapsed),
      "-",
      humanize.numberFormat(count, 0),
      humanize.numberFormat(count/elapsed),
      "-",
      humanize.numberFormat(JSON.stringify(data).length, 0),
      humanize.numberFormat(os.freemem(), 0)
    );
    if (keys % 10000 === 0) {
      console.log("resetting data");
      dataObjs.push(data);
      data = {};
      blockStartTime = new Date().getTime();
    }
    dataObjs = [];
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
      console.log("merging", dataObjs.length, "blocks")
      _.each(dataObjs, function (dataObj) {
        _.merge(data, dataObj);
        console.log("now", _.keys(data).length, "keys -",
          humanize.numberFormat(os.freemem(), 0));
      });
      d.resolve(data);
    });

  return d.promise;
};

module.exports = processFile;
