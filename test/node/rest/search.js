/*global describe, it */
var search = require("../../../lib/rest/search");

describe("search", function () {
  describe("search string", function () {
    it("should convert the search string to a like clause");
    it("should replace spaces with percentage signs");
  });
  describe("query processing", function () {
    it("should combine the results of the queries");
    //nb - seems to be doing string sort, not numerical sort atm
    it("should sort the results by event_count and then name");
    it("should remove duplicates");
    it("should return one element in the area if both edges are the same");
    it("should return two elements in the area if the edges are different");
  });
});