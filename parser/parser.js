var when = require("when"),
    sequence = require("when/sequence"),
    guard = require('when/guard'),
    _ = require("underscore"),
    lazy = require("lazy"),
    fs  = require("fs");

var db = require("../lib/db");

var processFile = function (file, lineProcessor, n) {
  var d = when.defer();

  var processor = new lazy(fs.createReadStream(file))

    .lines
    .skip(1)
    .take(n)
    .map(String)
    .filter(interestingLines)
    .forEach(lineProcessor)
    .on("pipe", function () {
      d.resolve(data);
    })
    // .end()

    // processor

 // .on("data", function (d) {console.log(d)})
  // processor;

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

var processLine = function (line) {
  var tokens = line.split(" ");
  var thing = tokens[0];
  var type = tokens[1];
  var value = tokens[2];

  // thing = /wiki\/(.*)\?/.exec(thing)[1];

  if (type in interestingTypes["position"]) {
    // type = interestingTypes["position"][type];
    value = value.split("\"")[1];
  }
  else if (type in interestingTypes["places"]) {
    // type = interestingTypes["places"][type];
    value = value;
  }
  else if (type in interestingTypes["dates"]) {
    // type = interestingTypes["dates"][type];
    value = value.split("\"")[1];
  }
  else if (type in interestingTypes["years"]) {
    // type = interestingTypes["years"][type];
    value = value.split("\"")[1];
  }

  typeCounts[type] = typeCounts[type] || 0;
  typeCounts[type] += 1;

  data[thing] = data[thing] || {};
  data[thing][type] = data[thing][type] || [];
  data[thing][type].push(value);

  // console.log(thing, type, value);
};

var logData = function (data) {
  console.log(data);
  console.log(typeCounts);
  console.log(_.keys(data).length, "out of", totalCount);
  
  var expressType = function(types) {
    var k = _.keys(types);
    k.sort(function (a, b) {
      return (types[a] < types[b] ? 1 : 
        (types[a] === types[b] ? 0 : -1));
    });
    k.reverse();
    _.each(k, function (kv) {
      if (!typeCounts[kv]) {
        console.log(kv, types[kv]);
      }
    });
    console.log("")
  }
  expressType(dateTypes);
  expressType(yearTypes);
  expressType(placeTypes);
};

var extractName = function (str) {
  return escapeQuote(decodeURIComponent(/.*\/(.*)>$/.exec(str)[1].replace(/_/g, " ")));
};

var escapeQuote = function (str) {
  return str.replace(/\'/g, "''");
};

var addPlaces = function (data) {

  var placeInsert = _.template(
    "INSERT INTO place (name, location, start_date, end_date) " +
    "VALUES ('<%= name %>', " +
    "ST_GeomFromText('POINT(' || <%= lon %> || ' ' || <%= lat %> || ')'), " +
    "<%= start_date %>, <%= end_date %>)"
  );

  var cleanLatLon = function (str) {
    str = str[0];
    var commaPos = str.indexOf(",");
    return commaPos > 0 ? str.substring(0, commaPos) : str; 
  }

  return when.map(_.pairs(data), guard(guard.n(1), function (pair) {
    var key = pair[0];
    var value = pair[1];
    if (value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"] &&
        value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"]) {
      var insert = placeInsert({
        name: extractName(key), 
        lat: cleanLatLon(value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"]),
        lon: cleanLatLon(value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"]), 
        start_date: "NULL", 
        end_date: "NULL"
      });
      return db.runQuery(insert).then(
    function () {
      // process.exit(0);
      console.log("done")
    }, 
    function (e) {
      console.log("failed",e);
    }
  );
    }
  })).then(
    function () {
      // process.exit(0);
      console.log("done")
    }, 
    function (e) {
      console.log("failed",e);
    }
  );
};

var addPeople = function (data) {

  var personInsert = _.template(
    "INSERT INTO person (name) " +
    "VALUES ('<%= name %>') " +
    "RETURNING id"
  );

  var eventInsert = _.template(
    "INSERT INTO event (name, place_id, start_date, end_date, attendee_count) " +
    "VALUES ('<%= name %>', <%= place_id %>, " +
    "'<%= start_date %>', '<%= end_date %>', " +
    "<%= attendee_count %>) " +
    "RETURNING id"
  );
  var eventAttendeeInsert = _.template(
    "INSERT INTO event_attendee (person_id, event_id) " +
    "VALUES (<%= person_id %>, <%= event_id %>)"
  );

  var getPlaceIdQuery = _.template("SELECT id FROM place WHERE name = '<%= name %>'");

  var getPlaceId = function (name) {

    return db.runQuery(getPlaceIdQuery({name: escapeQuote(name)}))
             .then(function (result) {
               return result.rows.length ? result.rows[0].id : null;
             });
  };
  return when.map(_.pairs(data), guard(guard.n(1), function (pair) {

    var key = pair[0];
    var value = pair[1];
    if (value["<http://dbpedia.org/ontology/birthDate>"] &&
        value["<http://dbpedia.org/ontology/birthPlace>"]) {
      var name = extractName(key);
      var insert = personInsert({
        name: escapeQuote(name)
      });
      return db.runQuery(insert).then(function (result) {
        var personId = result.rows[0].id;
        var birthPlace = extractName(value["<http://dbpedia.org/ontology/birthPlace>"][0]);
        return getPlaceId(birthPlace).then(function (placeId) {
          var birthday = value["<http://dbpedia.org/ontology/birthDate>"];
          var insert = eventInsert({
            name: escapeQuote(name + "'s birthday"), 
            place_id: placeId,
            start_date: birthday + " 00:00",
            end_date: birthday + " 23:59",
            attendee_count: 1
          });
          if(placeId) {
            return db.runQuery(insert).then(function (result) {
              var eventId = result.rows[0].id;
              var insert = eventAttendeeInsert({
                person_id: personId,
                event_id: eventId
              });
              return db.runQuery(insert);
            });
          }
        });
      });
    }
  })).then(
    function () {
      // process.exit(0);
      console.log("done")
    }, 
    function (e) {
      console.log("failed",e);
    }
  );
};

var n = Math.floor(20516861 / 100);

var file = "/home/pretzel/Downloads/dbpedia_data/mappingbased_properties_en.nq";

process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err);
});

processFile(file, processLine, n).then(function (data) {
  // logData(data);
  sequence(
    [addPlaces, addPeople], 
    data
  ).then(
    function () {
      process.exit(0);
    }, 
    function (e) {
      console.log("failed",e);
    }
  );
});
