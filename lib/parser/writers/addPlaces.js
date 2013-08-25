var when = require("when"),
    guard = require('when/guard'),
    _ = require("underscore"),
    db = require("../../db"),
    utils = require("../utils"),
    config = require("../config");

module.exports = function (data) {
  
  var placeInsert = _.template(
    "INSERT INTO place (name, location, start_date, end_date, link) " +
    "VALUES ('<%= name %>', " +
    "ST_GeomFromText('POINT(' || <%= lon %> || ' ' || <%= lat %> || ')'), " +
    "<%= start_date %>, <%= end_date %>, '<%= link %>') " +
    "RETURNING id"
  );

  var cleanLatLon = function (str) {
    var commaPos = str.indexOf(",");
    return commaPos > 0 ? str.substring(0, commaPos) : str; 
  }

  var counter = 0;

  return when.map(_.pairs(data), guard(guard.n(config.parallelism), function (pair) {
    counter += 1;
    if (counter % 1000 === 0) {
      console.log(counter);
    }
    var key = pair[0];
    var value = pair[1];

    if (value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"] &&
        value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"]) {

      var insert = placeInsert({
        name: utils.extractName(key), 
        lat: cleanLatLon(value["<http://www.w3.org/2003/01/geo/wgs84_pos#lat>"][0].value),
        lon: cleanLatLon(value["<http://www.w3.org/2003/01/geo/wgs84_pos#long>"][0].value), 
        start_date: "NULL", 
        end_date: "NULL",
        link: utils.escapeQuote(value.link)
      });

      return db.runQuery(insert).then(
        function (result) {
          value.id = result.rows[0].id;
        }, 
        function (e) {
          console.log("failed writing places", insert, e);
        }
      );

    }

  })).otherwise(
    function (e) {
      console.log("failed writing places", e);
    }
  );
};
