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
    //nb - seems to be doing string sort, not numerical sort atm
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
    it("should return points if they exist", function () {
      var dbPoints = {
        "type": "LineString",
        "coordinates": [
          [-20, 10],
          [40, -30]
        ]
      };

      Search.prototype.handleSearchResults.call(this, this.res, [
        {rows: [getRow(1, {points: JSON.stringify(dbPoints)})]},
        {rows: []}
      ]);
      this.result.should.eql([
        getResultRow(1, {
          points: [
            {lat: 10, lon: -20},
            {lat: -30, lon: 40}
          ]
        })
      ]);
    });
  });
});