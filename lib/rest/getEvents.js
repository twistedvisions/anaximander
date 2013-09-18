var _ = require("underscore");
var fs = require("fs");
var db = require("../db");

var getEventAttendeesAtPoint = _.template(fs.readFileSync("db_templates/get_event_attendees_at_point.sql").toString());

var generateEventFilters = function (params) {


  var filterString = "";
  if (params.typeFilters.length > 0) {
    filterString += "(thing.type_id not in (" + _.pluck(params.typeFilters, "id").join(", ") + "))";

    if ((params.subtypeFilters.length > 0) || (params.notSpecifiedTypeFilters.length > 0)) {
      filterString += " and ";
    }
  } 


  if (params.subtypeFilters.length > 0) {
    var subtypesGroupedByType = _.groupBy(params.subtypeFilters, function (subtypeFilter) {
      return subtypeFilter.parent_type;
    });
    var typeKeys = _.keys(subtypesGroupedByType);
    var notSpecifiedFilters = _.indexBy(params.notSpecifiedTypeFilters, "id");
    filterString += _.map(subtypesGroupedByType, function (subtypeFilters, parent_type) {
      var str = "((((thing.type_id = " + parent_type + 
        ") and (thing_subtype.thing_type_id not in (" + _.pluck(subtypeFilters, "id").join(", ") + 
        ")))";
      if (!notSpecifiedFilters[parent_type]) {
        str += " or (thing_subtype.thing_type_id is null))";
      }
      return str;
    }).join(" or ");
    filterString += " or (thing.type_id not in (" + typeKeys.join(", ") + "))))";
  }

  else if (params.notSpecifiedTypeFilters.length > 0) {
    var filterString = _.map(params.notSpecifiedTypeFilters, function (notSpecifiedFilter) {
      var id = notSpecifiedFilter.id;
      return "((thing.type_id = " + id + ") and (thing_subtype.thing_type_id is not null))";
    }).join(" or ");
    filterString += " or (thing.type_id not in (" + 
      _.pluck(params.notSpecifiedTypeFilters, "id").join(", ") + 
      "))";
  }

  if (filterString.length > 0) {
    return "and (" + filterString + ")";
  }

  return "";
};

module.exports = {
  generateEventFilters: generateEventFilters,
  init: function (app) {
    app.get("/location", function (req, res) {
      var params = req.query;

      params.typeFilters = JSON.parse(params.typeFilters);
      params.subtypeFilters = JSON.parse(params.subtypeFilters);
      params.notSpecifiedTypeFilters = JSON.parse(params.notSpecifiedTypeFilters);

      console.log("\n", params);
      var query = getEventAttendeesAtPoint({
        lat: parseFloat(params.lat), 
        lon: parseFloat(params.lon),
        radius: params.radius,
        start: params.start,
        end: params.end,
        eventFilters: generateEventFilters(params)
      });
      console.log(query);
      db.runQuery(query).then(
        function (result) {
          var rows = result.rows;
          _.map(rows, function (row) {
            var data;
            var location = row.location;
            if (/MULTILINESTRING/.test(location)) {
              data = /MULTILINESTRING\(\((.*)\)\)/.exec(location)[1];
              var latlons = data.split(",");
              var result = _.map(latlons, function (latlon) {
                var array = latlon.split(" ");
                return [parseFloat(array[1]), parseFloat(array[0])];
              });
              row.location = result;
            } else if (/POINT/.test(location)) {
              data = /POINT\((.*)\)/.exec(location)[1];
              var array = data.split(" ");
              row.location = [[parseFloat(array[1]), parseFloat(array[0])]];
            }
          });
          res.send(result.rows);
        }, 
        function () {
          console.log("err", arguments);
        }
      );
    });    
  }
};
