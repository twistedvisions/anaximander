/*global describe, it, beforeEach */

var _ = require("underscore");
var Search = require("../../../lib/rest/search");

var getRow = function (id, opts) {
  return _.extend({
    thing_id: id,
    event_count: id * 10,
    thing_name: "thing_name" + id,
    thing_link: "thing_link_" + id,
    thing_type_name: "thing_type_name_" + id,
    start_date: "2014-01-0" + id,
    end_date: "2014-01-0" + id,
    area: "BOX(10 -20,-30 40)"
  }, opts);
};

var getResultRow = function (id, opts) {
  var row = getRow(id, opts);
  if (!opts || !opts.area) {
    row.area = [
      {
        lat: -20,
        lon: 10
      }, {
        lat: 40,
        lon: -30
      }
    ];
  }

  return row;
};

describe("search", function () {
  describe("search string", function () {
    it("should convert the search string to a like clause", function () {
      Search.prototype.formatSearchString.call(this, "foo")
        .should.equal("%foo%");
    });
    it("should replace spaces with percentage signs", function () {
      Search.prototype.formatSearchString.call(this, "foo bar")
        .should.equal("%foo%bar%");
    });
    it("should replace new lines with percentage signs", function () {
      Search.prototype.formatSearchString.call(this, "foo\nbar")
        .should.equal("%foo%bar%");
    });
  });
  describe("query processing", function () {
    beforeEach(function () {
      this.res = {
        send: _.bind(function (_result) {
          this.result = _result;
        }, this)
      };
    });
    it("should combine the results of the queries", function () {
      Search.prototype.handleSearchResults.call(this, this.res, [
        {rows: [getRow(1)]},
        {rows: [getRow(2)]}
      ]);
      this.result.should.eql([
        getResultRow(2),
        getResultRow(1)
      ]);
    });

    it("should sort the results by event_count and then name", function () {
      Search.prototype.handleSearchResults.call(this, this.res, [
        {rows: [getRow(1, {event_count: 20})]},
        {rows: [getRow(2), getRow(3)]}
      ]);
      this.result.should.eql([
        getResultRow(3),
        getResultRow(1, {event_count: 20}),
        getResultRow(2)
      ]);
    });
    it("should remove duplicates across results of different queries", function () {
      Search.prototype.handleSearchResults.call(this, this.res, [
        {rows: []},
        {rows: [getRow(1), getRow(1)]}
      ]);
      this.result.should.eql([
        getResultRow(1)
      ]);
    });
    it("should remove duplicates within results of different queries", function () {
      Search.prototype.handleSearchResults.call(this, this.res, [
        {rows: [getRow(1)]},
        {rows: [getRow(1)]}
      ]);
      this.result.should.eql([
        getResultRow(1)
      ]);
    });
    it("should remove duplicates within results of different queries that are out of order", function () {
      Search.prototype.handleSearchResults.call(this, this.res, [
        {rows: [getRow(3), getRow(2, {event_count: 5})]},
        {rows: [getRow(2, {event_count: 100})]}
      ]);
      this.result.should.eql([
        getResultRow(2, {event_count: 100}),
        getResultRow(3)
      ]);
    });
    it("should return one element in the area if both edges are the same", function () {
      Search.prototype.handleSearchResults.call(this, this.res, [
        {rows: [getRow(1, {area: "BOX(10 -20,10 -20)"})]},
        {rows: []}
      ]);
      this.result.should.eql([
        getResultRow(1, {area: [{lat: -20, lon: 10}]})
      ]);
    });
    it("should return two elements in the area if the edges are different", function () {
      Search.prototype.handleSearchResults.call(this, this.res, [
        {rows: [getRow(1, {area: "BOX(10 -20,10.1 -20)"})]},
        {rows: []}
      ]);
      this.result.should.eql([
        getResultRow(1, {area: [{lat: -20, lon: 10}, {lat: -20, lon: 10.1}]})
      ]);
    });
    it("should return points and dates if they exist", function () {
      var dbPoints = {
        "type": "LineString",
        "coordinates": [
          [-20, 10],
          [40, -30]
        ]
      };

      var start_dates = "{\"2000-01-01 00:00:00+00\",\"2000-01-02 00:00:00+00\"}";
      var end_dates = "{\"2000-01-01 23:59:59+00\",\"2000-01-02 23:59:59+00\"}";

      var s = new Search({get: function () {}});
      s.handleSearchResults(this.res, [
        {rows: [getRow(1, {
          points: JSON.stringify(dbPoints),
          start_dates: start_dates,
          end_dates: end_dates,
          importance_values: [100, 200],
          start_offset_seconds: [0, 10],
          end_offset_seconds: [0, 10],
          event_names: ["event name 1", "event name 2"],
          place_names: ["place name 1", "place name 2"],
          event_ids: [1, 2]
        })]},
        {rows: []}
      ]);
      this.result.should.eql([
        getResultRow(1, {
          points: [
            {
              lat: 10,
              lon: -20,
              start_date: new Date("2000-01-01T00:00:00.000Z"),
              start_offset_seconds: 0,
              end_date: new Date("2000-01-01T23:59:59.000Z"),
              end_offset_seconds: 0,
              event_id: 1,
              event_name: "event name 1",
              place_name: "place name 1",
              importance_value: 100
            },
            {
              lat: -30,
              lon: 40,
              start_date: new Date("2000-01-02T00:00:00.000Z"),
              start_offset_seconds: 10,
              end_date: new Date("2000-01-02T23:59:59.000Z"),
              end_offset_seconds: 10,
              event_id: 2,
              event_name: "event name 2",
              place_name: "place name 2",
              importance_value: 200
            }
          ]
        })
      ]);
    });
    it("should handle long timezone offsets", function () {
      var dbPoints = {
        "type": "LineString",
        "coordinates": [
          [-20, 10],
          [40, -30]
        ]
      };

      var start_dates = "{\"1811-01-06 04:58:45-00:01:15\",\"1811-01-06 04:58:45+00:01:15\"}";
      var end_dates = "{\"1811-01-07 04:58:45-00:01:15\",\"1811-01-07 04:58:45+00:01:15\"}";
      var s = new Search({get: function () {}});
      s.handleSearchResults(this.res, [
        {rows: [getRow(1, {
          points: JSON.stringify(dbPoints),
          start_dates: start_dates,
          start_offset_seconds: [0, 0],
          end_dates: end_dates,
          end_offset_seconds: [0, 0],
          importance_values: [100, 200],
          event_ids: [1, 2],
          event_names: ["event name 1", "event name 2"],
          place_names: ["place name 1", "place name 2"]
        })]},
        {rows: []}
      ]);
      this.result.should.eql([
        getResultRow(1, {
          points: [
            {
              lat: 10,
              lon: -20,
              start_date: new Date("1811-01-06 05:00:00.000Z"),
              start_offset_seconds: 0,
              end_date: new Date("1811-01-07 05:00:00.000Z"),
              end_offset_seconds: 0,
              event_id: 1,
              event_name: "event name 1",
              place_name: "place name 1",
              importance_value: 100
            },
            {
              lat: -30,
              lon: 40,
              start_date: new Date("1811-01-06 04:57:30.000Z"),
              start_offset_seconds: 0,
              end_date: new Date("1811-01-07 04:57:30.000Z"),
              end_offset_seconds: 0,
              event_id: 2,
              event_name: "event name 2",
              place_name: "place name 2",
              importance_value: 200
            }
          ]
        })
      ]);
    });
  });
});