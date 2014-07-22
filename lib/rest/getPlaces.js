var _ = require("underscore");
var db = require("../db");
var winston = require("winston");

module.exports = {
  init: function (app) {
    app.get("/place", function (req, res) {
      var params = req.query;
      var placeName = params.q;
      placeName = placeName.replace(/\s+/g, "%");

      if (placeName.length <= 2) {
        placeName = "should not find this name";
      }

      db.runQuery("get_nearest_places",
        [
          parseFloat(params.lon),
          parseFloat(params.lat),
          placeName
        ]
      ).then(
        function (result) {
          var rows = result.rows;

          var lastDistance = 0;

          rows = [_.first(rows)].concat(_.filter(_.rest(rows), function (row) {
            if (row.distance < lastDistance) {
              return false;
            }
            lastDistance = row.distance;
            return true;
          }));

          _.map(rows, function (row) {
            var data;
            var location = row.location;
            //TODO: refactor out of this and getEvents
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
        function (err) {
          res.send(500, "Bad query");
          winston.error("failed to process /place query", {
            params: params,
            error: err
          });
        }
      );
    });
  }
};
