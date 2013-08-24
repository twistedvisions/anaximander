
var when = require("when"),
    _ = require("underscore"),
    lazy = require("lazy"),
    fs  = require("fs");

var processFile = function (file, n) {
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

var interestingTypes = {
  position: {
    "<http://www.w3.org/2003/01/geo/wgs84_pos#lat>": "lat",
    "<http://www.w3.org/2003/01/geo/wgs84_pos#long>": "lon"
  },
  places: {
    "<http://dbpedia.org/ontology/place>": "place",
    "<http://dbpedia.org/ontology/birthPlace>": "birthPlace",
    "<http://dbpedia.org/ontology/deathPlace>": "deathPlace",
    "<http://dbpedia.org/ontology/placeOfBurial>": "placeOfBurial",
    "<http://dbpedia.org/ontology/locationCity>": "locationCity",
    "<http://dbpedia.org/ontology/locationCountry>": "locationCountry",
    "<http://dbpedia.org/ontology/restingPlace>": "restingPlace",
    "<http://dbpedia.org/ontology/foundationPlace>": "foundationPlace",
    "<http://dbpedia.org/ontology/premierePlace>": "premierePlace"
  },
  dates: {
    "<http://dbpedia.org/ontology/date>": "date",
    "<http://dbpedia.org/ontology/birthDate>": "birthDate",
    "<http://dbpedia.org/ontology/deathDate>": "dateDate",
    "<http://dbpedia.org/ontology/foundingDate>": "foundingDate",
    "<http://dbpedia.org/ontology/activeYearsStartDate>": "activeYearsStartDate",
    "<http://dbpedia.org/ontology/activeYearsEndDate>": "activeYearsEndDate",
    "<http://dbpedia.org/ontology/premiereDate>": "premiereDate",
    "<http://dbpedia.org/ontology/formationDate>": "formationDate"
  },
  years: {
    "<http://dbpedia.org/ontology/birthYear>": "birthYear",
    "<http://dbpedia.org/ontology/deathYear>": "deathYear",
    "<http://dbpedia.org/ontology/foundingYear>": "foundingYear",
    "<http://dbpedia.org/ontology/activeYearsStartYear>": "activeYearsStartYear",
    "<http://dbpedia.org/ontology/activeYearsEndYear>": "activeYearsEndYear",
    "<http://dbpedia.org/ontology/premiereYear>": "premiereYear",
    "<http://dbpedia.org/ontology/formationYear>": "formationYear"
  }
}

getInterestingTypes = function () {
  return _.map(_.values(interestingTypes), function (obj) {
    return _.keys(obj).join("|");
  }).join("|")
};

var interestingLinesRegExp = new RegExp(getInterestingTypes());

var totalCount = 0;

var dateTypes = {}
var yearTypes = {}
var placeTypes = {}

var interestingLines = function (line) {
  totalCount += 1;
  var type = line.split(" ")[1];
  if (type.indexOf("Date") >= 0) {
    dateTypes[type] = dateTypes[type] || 0;
    dateTypes[type] += 1;
  }
  if (type.indexOf("Year") >= 0) {
    yearTypes[type] = yearTypes[type] || 0;
    yearTypes[type] += 1;
  }
  if (type.indexOf("Place") >= 0) {
    placeTypes[type] = placeTypes[type] || 0;
    placeTypes[type] += 1;
  }
  return interestingLinesRegExp.test(line);
};

var data = {};
var typeCounts={};


var extractLink = function (str) {
  return /<(.*)\?.*>/.exec(str)[1];
};

var processLine = function (line) {
  var tokens = line.split(" ");
  var thing = tokens[0];
  var type = tokens[1];
  var value = tokens[2];
  var wikipage = tokens[3];

  
  if (type in interestingTypes["position"]) {

    value = value.split("\"")[1];
 
  } else if (type in interestingTypes["places"]) {
 
    value = value;
 
  } else if (type in interestingTypes["dates"]) {
 
    value = value.split("\"")[1];
 
  } else if (type in interestingTypes["years"]) {
 
    value = value.split("\"")[1];
  }

  typeCounts[type] = typeCounts[type] || 0;
  typeCounts[type] += 1;

  data[thing] = data[thing] || {};
  data[thing][type] = data[thing][type] || [];
  data[thing][type].push({
    value: value,
    link: extractLink(wikipage)
  });

};

module.exports = processFile;
