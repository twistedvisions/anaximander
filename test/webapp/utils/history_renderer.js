/*global describe, it */
define(

  ["underscore", "jquery", "backbone", "moment", "utils/history_renderer"],

  function (_, $, Backbone, moment, HistoryRenderer) {
    describe("history renderer", function () {
      it("should show single changes with authors and dates for each line", function () {
        var historyCollection = new Backbone.Collection([
          {
            name: "event 1",
            type: "event",
            mode: "edit",
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
            mode: "creation",
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

        html.find("td.field")[0].textContent.should.equal("event edit");
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
      it("should match old and new keys", function () {
        var historyCollection = new Backbone.Collection([
          {
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "key1": "value1",
              "key2": "value2"
            },
            old_values: {
              "key1": "value1 old"
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        try {
          $("body").append(html);
          html.find("td.value")[1].textContent.should.equal("value1");
          html.find("td.old-value")[1].textContent.should.equal("value1 old");
          html.find("td.value")[2].textContent.should.equal("value2");
          html.find("td.old-value")[2].textContent.should.equal("");
        } finally {
          html.remove();
        }
      });
      it("should show default importances with a nice key", function () {
        var historyCollection = new Backbone.Collection([
          {
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "defaultImportance": "new value"
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        try {
          $("body").append(html);
          html.find("td.field")[1].textContent.should.equal("default importance");
        } finally {
          html.remove();
        }
      });
      it("should show the reason first", function () {
        var historyCollection = new Backbone.Collection([
          {
            name: "event 1",
            type: "event",
            mode: "edit",
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "aaa": "value2",
              "reason": "value1"
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.field").first().text().should.equal("event edit");
        $(html.find("td.field")[1]).text().should.equal("reason");
        html.find("td.field").last().text().should.equal("aaa");
      });
      it("should show a message for deletions", function () {
        var historyCollection = new Backbone.Collection([
          {
            name: "event 1",
            type: "event",
            mode: "edit",
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "deleted": true
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.field").first().text().should.equal("event deleted");
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
      it("should format old dates", function () {
        var historyCollection = new Backbone.Collection([
          {
            name: "event 1",
            type: "event",
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "id": "value1",
              "start_date": "1459-12-21 21:58:45-00:01:02"
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.value")[1].textContent.should.equal("Dec 21 1459 9:59 PM");
      });
      it("should linkify links", function () {
        var historyCollection = new Backbone.Collection([
          {
            name: "event 1",
            type: "event",
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "id": "value1",
              "link": "http://somelink.com"
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.value a").length.should.equal(1);
        html.find("td.value a").attr("href").should.equal("http://somelink.com");
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
      it("should format the json of subtypes into text", function () {
        var historyCollection = new Backbone.Collection([
          {
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "id": "value1",
              "newSubtypes": [
                {
                  type: "typeName1",
                  importance: "importanceName1"
                }
              ]
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.value").text()
          .should.equal("typeName1 with importance: importanceName1");
      });
      it("should format dates correctly in local event time", function () {
        var historyCollection = new Backbone.Collection([
          {
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              id: "value1",
              start_date: "1837-06-22T06:00:00.000Z",
              start_offset_seconds: -21600
            }
          }
        ]);
        var html = $(HistoryRenderer(historyCollection));
        html.find("td.value").text()
          .should.equal(moment([1837, 5, 22]).format("lll"));
      });
    });
  }
);