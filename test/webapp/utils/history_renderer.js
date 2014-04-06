/*global describe, it */
define(

  ["underscore", "jquery", "backbone", "utils/history_renderer"],

  function (_, $, Backbone, HistoryRenderer) {
    describe("history renderer", function () {
      it("should show single changes with authors and dates for each line", function () {
        var historyCollection = new Backbone.Collection([
          {
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "key": "value1"
            }
          },
          {
            date: new Date().toISOString(),
            username: "y",
            new_values: {
              "key": "value2"
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.username").length.should.equal(2);
        html.find("td.username")[0].textContent.length.should.be.greaterThan(0);
        html.find("td.username")[1].textContent.length.should.be.greaterThan(0);

        html.find("td.date").length.should.equal(2);
        html.find("td.date")[0].textContent.length.should.be.greaterThan(0);
        html.find("td.date")[1].textContent.length.should.be.greaterThan(0);

        html.find("td.field")[0].textContent.should.equal("key");
        html.find("td.value")[0].textContent.should.equal("value1");

      });
      it("should show multiple changes with only one author and date per change set", function () {
        var historyCollection = new Backbone.Collection([
          {
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "key1": "value1",
              "key2": "value2"
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        try {
          $("body").append(html);
          var visibleFilter = function (i, el) {
            return $(el).css("visibility") === "visible";
          };
          html.find("td.username span").filter(visibleFilter).length.should.equal(1);
          html.find("td.date span:visible").filter(visibleFilter).length.should.equal(1);
        } finally {
          $("body").remove(".table");
        }
      });
      it("should create an entry for ids", function () {
        var historyCollection = new Backbone.Collection([
          {
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "id": "value1",
              "key2": "value2"
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.username").length.should.equal(1);
      });
    });
  }
);