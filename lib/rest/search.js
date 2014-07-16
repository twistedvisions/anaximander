var winston = require("winston");
var when = require("when");
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
  var all = events.concat(places);
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
      var start_dates = _.map(x.start_dates, this.getDate, this);
      var end_dates = _.map(x.end_dates, this.getDate, this);
      var importanceValues = x.importance_values;
      var points = JSON.parse(x.points).coordinates;
      var events = _.zip(points,
        start_dates, x.start_offset_seconds,
        end_dates, x.end_offset_seconds,
        x.event_ids, x.event_names, x.event_links,
        x.place_ids, x.place_names,
        importanceValues);

      x.points = _.map(events, function (event) {
        return {
          lat: event[0][1],
          lon: event[0][0],
          start_date: new Date(event[1]).toISOString(),
          start_offset_seconds: event[2],
          end_date: new Date(event[3]).toISOString(),
          end_offset_seconds: event[4],
          event_id: parseInt(event[5], 10),
          event_name: event[6],
          event_link: event[7],
          place_id: event[8],
          place_name: event[9],
          importance_value: event[10]
        };
      });
      x.start_offset_seconds = x.points[0].start_offset_seconds;
      x.end_offset_seconds = x.points[x.points.length - 1].end_offset_seconds;

      delete x.start_dates;
      delete x.end_dates;
      delete x.event_names;
      delete x.event_links;
      delete x.place_ids;
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
  return new Date(str);
};

module.exports = Search;