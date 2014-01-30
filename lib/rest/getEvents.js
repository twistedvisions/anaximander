var _ = require("underscore");
var db = require("../db");
var sortBy = require("../util/sort");
var winston = require("winston");

var getTypeFilterString = function (params) {
  var filterString = "";
  if (params.typeFilters.length > 0) {
    filterString += "(thing.type_id not in (" + _.pluck(params.typeFilters, "id").join(", ") + "))";
  }
  return filterString;
};

var getUnspecifiedSubTypeFilterString = function (ids) {
  var filterString = _.map(ids, function (id) {
    return "((thing.type_id = " + id + ") and (thing_subtype.thing_type_id is not null))";
  }).join(" or ");

  filterString += " or (thing.type_id not in (" + ids.join(", ") + "))";

  return "(" + filterString + ")";
};

var getSpecifiedSubTypeFilterString = function (params) {
  var filterString = "";
  var subtypesGroupedByType = _.groupBy(params.subtypeFilters, function (subtypeFilter) {
    return subtypeFilter.parent_type;
  });
  var typeKeys = _.keys(subtypesGroupedByType);
  var notSpecifiedFilters = _.indexBy(params.notSpecifiedTypeFilters, "id");
  var notSpecifiedFiltersUsed = [];
  filterString += _.map(subtypesGroupedByType, function (subtypeFilters, parent_type) {
    parent_type = parseInt(parent_type, 10);
    var str =
      "(" +
        "(thing.type_id = " + parent_type + ") and " +
        "(" +
          "(thing_subtype.thing_type_id not in (" + _.pluck(subtypeFilters, "id").join(", ") + "))";
    if (!notSpecifiedFilters[parent_type]) {
      str += " or (thing_subtype.thing_type_id is null)";
    } else {
      notSpecifiedFiltersUsed.push(parent_type);
    }
    str += "))";



    return str;
  }).join(" or ");
  filterString += " or (thing.type_id not in (" + typeKeys.join(", ") + "))";
  filterString = "(" + filterString + ")";

  var notSpecifiedFiltersNotUsed = _.difference(
    _.pluck(params.notSpecifiedTypeFilters, "id"),
    notSpecifiedFiltersUsed
  );

  if (notSpecifiedFiltersNotUsed.length > 0) {
    filterString = "(" + filterString + ") and " +
      getUnspecifiedSubTypeFilterString(notSpecifiedFiltersNotUsed);
  }
  return filterString;
};

var getSubTypeFilterString = function (params) {
  if (params.subtypeFilters.length > 0) {
    return getSpecifiedSubTypeFilterString(params);
  }

  else if (params.notSpecifiedTypeFilters.length > 0) {
    return getUnspecifiedSubTypeFilterString(_.pluck(params.notSpecifiedTypeFilters, "id"));
  }

  return "";
};

var generateEventFilters = function (params) {


  var filterString = _.filter([
    getTypeFilterString(params),
    getSubTypeFilterString(params)
  ], function (str) {
    return str.length > 0;
  }).join(" and ");


  if (filterString.length > 0) {
    return "and (" + filterString + ")";
  }

  return "";
};

var boundingBoxTemplate = _.template([
  "POLYGON((",
  "<%= ne_lon %> <%= ne_lat %>,",
  "<%= ne_lon %> <%= sw_lat %>,",
  "<%= sw_lon %> <%= sw_lat %>,",
  "<%= sw_lon %> <%= ne_lat %>,",
  "<%= ne_lon %> <%= ne_lat %> ",
  "))"
].join(" "));

var parseLocation = function (row) {
  var location = row.location;
  var data;
  if (/MULTILINESTRING/.test(location)) {
    data = /MULTILINESTRING\(\((.*)\)\)/.exec(location)[1];
    var latlons = data.split(",");
    var result = _.map(latlons, function (latlon) {
      var array = latlon.split(" ");
      return [parseFloat(array[1]), parseFloat(array[0])];
    });
    location = result;
  } else if (/POINT/.test(location)) {
    data = /POINT\((.*)\)/.exec(location)[1];
    var array = data.split(" ");
    location = [[parseFloat(array[1]), parseFloat(array[0])]];
  }
  return location;
};

var thingKeys = [
  "thing_id",
  "thing_name",
  "thing_type"
];

var handleResult = function (res, result) {
  var rows = result.rows;
  var byEvent = _.groupBy(rows, "event_id");
  var events = _.map(byEvent, function (eventArray) {
    var event = _.omit(eventArray[0], thingKeys);
    event.attendees = _.map(eventArray, function (e) {
      return _.pick(e, thingKeys);
    });
    return event;
  });
  events.sort(sortBy("distance", "start_date"));
  events = _.map(events, function (event) {
    event.location = parseLocation(event);
    return event;
  });
  res.send(events);
};

var handleError = function (res, params, e) {
  res.send(500, "Bad query");
  winston.error("failed to process /location query", {
    params: params
  });
  winston.error(e);
};

module.exports = {
  generateEventFilters: generateEventFilters,
  init: function (app) {
    app.get("/location", function (req, res) {

      var params = req.query;

      params.typeFilters = JSON.parse(params.typeFilters);
      params.subtypeFilters = JSON.parse(params.subtypeFilters);
      params.notSpecifiedTypeFilters = JSON.parse(params.notSpecifiedTypeFilters);

      var bounds = params.bounds;
      var boundingBox = boundingBoxTemplate({
        ne_lon: bounds[0][1],
        ne_lat: bounds[0][0],
        sw_lon: bounds[1][1],
        sw_lat: bounds[1][0]
      });

      var queryParameters = [
        parseFloat(params.lon), //lon
        parseFloat(params.lat), //lat
        params.start, //start
        params.end //end
      ];

      db.runQuery("get_event_attendees_in_area", queryParameters, {
        eventFilters: generateEventFilters(params),
        boundingBox: boundingBox
      }).then(
        _.bind(handleResult, this, res),
        _.bind(handleError, this, res, params)
      );

    });
  }
};
