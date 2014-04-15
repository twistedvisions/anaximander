/*global describe, it */
define(

  ["underscore", "jquery", "backbone", "utils/history_renderer"],

  function (_, $, Backbone, HistoryRenderer) {
    describe("history renderer", function () {
      it("should show single changes with authors and dates for each line", function () {
        var historyCollection = new Backbone.Collection([
          {
            name: "event 1",
            type: "event",
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "key": "value1",
              "reason": "something"
            }
          },
          {
            name: "thing 1",
            type: "thing",
            date: new Date().toISOString(),
            username: "y",
            new_values: {
              "key": "value2",
              "reason": "something"
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.username").length.should.equal(6);
        html.find("td.username")[0].textContent.length.should.be.greaterThan(0);

        html.find("td.date").length.should.equal(6);
        html.find("td.date")[0].textContent.length.should.be.greaterThan(0);

        html.find("td.field")[0].textContent.should.equal("event");
        html.find("td.value")[0].textContent.should.equal("event 1");

        html.find("td.field")[1].textContent.should.equal("reason");
        html.find("td.value")[1].textContent.should.equal("something");

        html.find("td.field")[2].textContent.should.equal("key");
        html.find("td.value")[2].textContent.should.equal("value1");

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
          html.find("td.username span:visible").filter(visibleFilter).length.should.equal(1);
          html.find("td.date span:visible").filter(visibleFilter).length.should.equal(1);
        } finally {
          html.remove();
        }
      });
      it("should show the reason first", function () {
        var historyCollection = new Backbone.Collection([
          {
            name: "event 1",
            type: "event",
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "aaa": "value2",
              "reason": "value1"
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.field").first().text().should.equal("event");
        $(html.find("td.field")[1]).text().should.equal("reason");
        html.find("td.field").last().text().should.equal("aaa");
      });
      it("should not create an entry for ids", function () {
        var historyCollection = new Backbone.Collection([
          {
            name: "event 1",
            type: "event",
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "id": "value1",
              "key2": "value2"
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.username").length.should.equal(2);
      });
      it("should show arrays of participants as multiple entries", function () {
        var historyCollection = new Backbone.Collection([
          {
            name: "event 1",
            type: "event",
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "id": "value1",
              "newParticipants": [
                {
                  thing: "thingName1",
                  type: "typeName1",
                  importance: "importanceName1"
                },
                {
                  thing: "thingName2",
                  type: "typeName2",
                  importance: "importanceName2"
                }
              ]
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.value").length.should.equal(3);
      });
      it("should format the json of participants into text", function () {
        var historyCollection = new Backbone.Collection([
          {
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "id": "value1",
              "newParticipants": [
                {
                  thing: "thingName1",
                  type: "typeName1",
                  importance: "importanceName1"
                }
              ]
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.value").text()
          .should.equal("thingName1 as typeName1 with importance: importanceName1");
      });
    });
  }
);