/*global describe, it */
define(

  ["underscore", "jquery", "utils/date_formatter"],

  function (_, $, DateFormatter) {
    describe("date formatter", function () {

      describe("formatDateRange", function () {
        it("should show the date range without era if all CE", function () {
          DateFormatter.formatDateRange(new Date(2000, 0, 1), new Date(2001, 1, 2))
            .should.equal("01/01/2000 \u2013 02/02/2001");
        });
        it("should show the date range with era at end if all BCE", function () {
          DateFormatter.formatDateRange(new Date(-2001, 0, 1), new Date(-2000, 1, 2))
            .should.equal("01/01/2001 \u2013 02/02/2000 BCE");
        });
        it("should show the date range with eras after each spans BCE to CE", function () {
          DateFormatter.formatDateRange(new Date(-2000, 0, 1), new Date(2001, 1, 2))
            .should.equal("01/01/2000 BCE \u2013 02/02/2001 CE");
        });
      });

      describe("formatDateTimeRange", function () {
        it("should show the date range if longer than a day", function () {
          DateFormatter.formatDateTimeRange(new Date(-2001, 0, 1), new Date(-2000, 1, 2))
            .should.equal("01/01/2001 \u2013 02/02/2000 BCE");
        });
        it("should show the time range and date if shorter than a day", function () {
          DateFormatter.formatDateTimeRange(new Date(2000, 0, 1, 9, 1, 18), new Date(2000, 0, 1, 14, 11, 13))
            .should.equal("09:01 \u2013 14:11 01/01/2000");
        });
        it("should show the time range and date if shorter than a day BCE", function () {
          DateFormatter.formatDateTimeRange(new Date(-2001, 0, 1, 11, 1, 18), new Date(-2001, 0, 1, 12, 11, 13))
            .should.equal("11:01 \u2013 12:11 01/01/2001 BCE");
        });
        it("should show the time range and date if shorter than a day and spans midnight", function () {
          DateFormatter.formatDateTimeRange(new Date(2000, 0, 1, 9, 1, 18), new Date(2000, 0, 2, 7, 11, 13))
            .should.equal("09:01 \u2013 07:11 02/01/2000");
        });
        it("should show the date only if one whole day", function () {
          DateFormatter.formatDateTimeRange(new Date(2001, 0, 1), new Date(2001, 0, 1, 23, 59))
            .should.equal("01/01/2001");
        });
      });
    });
  }
);