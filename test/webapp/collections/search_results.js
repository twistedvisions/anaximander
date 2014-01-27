/*global describe, it, beforeEach */
define(

  ["collections/search_results"],

  function (SearchResults) {
    describe("search results", function () {
      beforeEach(function () {
        this.searchResults = new SearchResults();
      });
      describe("parse", function () {
        it("should convert the start date to a JS date", function () {
          this.searchResults.parse([{
            start_date: "1900-01-01"
          }])[0].start_date.should.eql(new Date(1900, 0, 1));
        });
        it("should convert the end date to a JS date", function () {
          this.searchResults.parse([{
            end_date: "1900-01-01"
          }])[0].end_date.should.eql(new Date(1900, 0, 1));
        });
      });
    });
  }
);