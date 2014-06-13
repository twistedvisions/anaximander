var winston = require("winston");
var when = require("when");
var moment = require("moment");
var _ = require("underscore");
var db = require("../db");

var Search = function (app) {
  app.get("/search", _.bind(this.handleSearch, this));
};

Search.prototype.handleSearch = function (req, res) {
  var args = [this.formatSearchString(req.param("string"))];
  when.all([
    db.runQuery("find_event_places_by_name", args),
    db.runQuery("find_event_things_by_name", args)
  ]).then(
    _.bind(this.handleSearchResults, this, res),
    function () {
      winston.error("failed to process /type request", arguments);
    }
  );
};

Search.prototype.formatSearchString = function (searchTerm) {
  return "%" + searchTerm.replace(/\s+/g, "%") + "%";
};

Search.prototype.handleSearchResults = function (res, results) {
  var places = results[0].rows;
  var events = results[1].rows;
  var all = places.concat(events);
  all.sort(function (a, b) {
    var e1 = a.event_count;
    var e2 = b.event_count;

    var n1 = a.thing_name;
    var n2 = b.thing_name;

    return e1 < e2 ? 1 : (e1 === e2 ? (n1 > n2 ? 1 : (n1 === n2 ? 0 : -1)) : -1);
  });
  all = _.unique(all, false, function (x) {
    return x.thing_name;
  });
  all = _.map(all, function (x) {
    if (/^BOX\(/.test(x.area)) {
      var str = x.area.substring(4, x.area.length - 1).toString();
      var edges = str.split(",");
      var first = edges[0].split(" ");

      x.area = [{
        lat: parseFloat(first[1]),
        lon: parseFloat(first[0])
      }];
      if (edges[0] !== edges[1]) {
        var second = edges[1].split(" ");
        x.area.push({
          lat: parseFloat(second[1]),
          lon: parseFloat(second[0])
        });
      }
    }
    if (x.points && x.start_dates) {
      var start_dates = _.map(x.start_dates.replace("{", "").replace("}", "").split(","), this.getDate, this);
      var end_dates = _.map(x.end_dates.replace("{", "").replace("}", "").split(","), this.getDate, this);
      var importanceValues = x.importance_values;
      var points = JSON.parse(x.points).coordinates;
      var events = _.zip(points,
        start_dates, x.start_offset_seconds,
        end_dates, x.end_offset_seconds,
        x.event_ids, x.event_names,
        x.place_names,
        importanceValues);

      x.points = _.map(events, function (event) {
        return {
          lat: event[0][1],
          lon: event[0][0],
          start_date: new Date(event[1]),
          start_offset_seconds: event[2],
          end_date: new Date(event[3]),
          end_offset_seconds: event[4],
          event_id: event[5],
          event_name: event[6],
          place_name: event[7],
          importance_value: event[8]
        };
      });
      delete x.start_dates;
      delete x.start_offset_seconds;
      delete x.end_dates;
      delete x.end_offset_seconds;
      delete x.event_names;
      delete x.place_names;
      delete x.event_ids;
      delete x.importance_values;
    }
    return x;
  }, this);
  res.send(all);
};


Search.prototype.longTimestampRegex = /(\d\d\d\d\-\d\d\-\d\d \d\d:\d\d:\d\d)([+\-])(\d\d:\d\d:\d\d)/;
Search.prototype.getDate = function (str) {
  var d;
  var m = str.match(this.longTimestampRegex);
  if (m) {
    d = new Date(
      new Date(m[1]).getTime() +
      (m[2] === "-" ? 1 : -1) * new Date("1970-01-01 " + m[3]).getTime()
    );
  } else {
    d = moment(str.toString(), "YYYY-MM-DD hh:mm:ss").toDate();
    d = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000);
  }
  return d;
};

module.exports = Search;