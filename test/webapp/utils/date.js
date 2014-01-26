/*global describe, it */
define(

  ["underscore", "jquery", "utils/date"],

  function (_, $, date) {
    describe("date", function () {

      describe("formatYearAsTimestamp", function () {
        it("should pad the year so it is 4 digits when the year is < 100AD", function () {
          date.formatYearAsTimestamp(99, "").should.equal("0099");
        });
        it("should pad the year so it is 4 digits when the year is < 1000AD", function () {
          date.formatYearAsTimestamp(999, "").should.equal("0999");
        });
        it("should format the year appropriately when it is BC", function () {
          date.formatYearAsTimestamp(-48, "").should.equal("0048 BC");
        });
      });
    });
  }
);