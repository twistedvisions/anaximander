/*global sinon, describe, it, beforeEach, afterEach */
define(

  ["chai", "jquery", "backbone", "views/thing_summary", "analytics"],

  function (chai, $, Backbone, ThingSummary, analytics) {
    var should = chai.should();
    describe("thing summary", function () {
      beforeEach(function () {
        this.model = new Backbone.Model({
          importance: 10,
          date: [1900, 2020]
        });
        this.thingSummary = new ThingSummary({model: this.model, el: null});
      });
      describe("interaction", function () {
        beforeEach(function () {
          sinon.stub(this.thingSummary, "showPoint");
          sinon.stub(analytics, "thingSummary_scroll");
          this.thingSummary.highlight = {points: [{id: 1}, {id: 2}, {id: 3}]};
          this.thingSummary.points = this.thingSummary.highlight.points;
        });
        afterEach(function () {
          analytics.thingSummary_scroll.restore();
        });
        describe("previous button", function () {
          it("should decrement the index when the previous button is shown.", function () {
            this.thingSummary.index = 2;
            this.thingSummary.showPrevious();
            this.thingSummary.index.should.equal(1);
          });
          it("should wrap around if the index is less than -1", function () {
            this.thingSummary.index = -1;
            this.thingSummary.showPrevious();
            this.thingSummary.index.should.equal(2);
          });
          it("should track clicks", function () {
            this.thingSummary.showPrevious();
            analytics.thingSummary_scroll.calledOnce.should.equal(true);
          });
        });
        describe("next button", function () {
          it("should increment the index when the next button is shown.", function () {
            this.thingSummary.index = 1;
            this.thingSummary.showNext();
            this.thingSummary.index.should.equal(2);
          });
          it("should wrap around to -1 if the index is more than the amount of points", function () {
            this.thingSummary.index = 2;
            this.thingSummary.showNext();
            this.thingSummary.index.should.equal(-1);
          });
          it("should track clicks", function () {
            this.thingSummary.showNext();
            analytics.thingSummary_scroll.calledOnce.should.equal(true);
          });
        });
      });
      describe("filter points", function () {
        it("should filter events by importance", function () {
          this.model.set("importance", 10);
          this.thingSummary.filterPoints([
            {
              importance_value: 9,
              start_date: new Date(1950, 0, 1)
            },
            {
              importance_value: 10,
              start_date: new Date(1950, 0, 1)
            },
            {
              importance_value: 11,
              start_date: new Date(1950, 0, 1)
            }
          ]).length.should.equal(2);
        });
        describe("filter dates", function () {
          beforeEach(function () {
            this.model.set("importance", 8);
            this.model.set("date", [1900, 2000]);
          });
          it("should filter out dates that are before the start", function () {
            this.thingSummary.filterPoints([
              {
                importance_value: 10,
                start_date: new Date(1899, 11, 31),
                end_date: new Date(1899, 11, 31, 23, 59, 59)
              }
            ]).length.should.equal(0);
          });
          it("should filter out dates whose start is before the start", function () {
            this.thingSummary.filterPoints([
              {
                importance_value: 10,
                start_date: new Date(1899, 11, 31),
                end_date: new Date(1900, 11, 31, 23, 59, 59)
              }
            ]).length.should.equal(0);
          });
          it("should not filter out dates that just after the start", function () {
            this.thingSummary.filterPoints([
              {
                importance_value: 10,
                start_date: new Date(1900, 0, 1),
                end_date: new Date(1900, 0, 1, 23, 59, 59)
              }
            ]).length.should.equal(1);
          });
          it("should not filter out dates that just before the end", function () {
            this.thingSummary.filterPoints([
              {
                importance_value: 10,
                start_date: new Date(2000, 11, 31),
                end_date: new Date(2000, 11, 31, 23, 59, 59)
              }
            ]).length.should.equal(1);
          });
          it("should filter out dates that are after the end", function () {
            this.thingSummary.filterPoints([
              {
                importance_value: 10,
                start_date: new Date(2001, 0, 1),
                end_date: new Date(2001, 0, 1, 23, 59, 59)
              }
            ]).length.should.equal(0);
          });
          it("should filter out dates whose end is after the end", function () {
            this.thingSummary.filterPoints([
              {
                importance_value: 10,
                start_date: new Date(1999, 0, 1),
                end_date: new Date(2001, 0, 1, 23, 59, 59)
              }
            ]).length.should.equal(0);
          });
        });
      });
      describe("model update", function () {
        describe("nothing highlighted", function () {
          it("should hide", function () {
            this.thingSummary.render();
            this.thingSummary.$el.show();
            this.thingSummary.update();
            this.thingSummary.$el.css("display").should.equal("none");
          });
        });
        describe("newly highlighted", function () {
          beforeEach(function () {
            this.thingSummary.render();
            this.model.set("highlight", {
              importance: 10,
              name: "thing name",
              link: "http://thing.com/link",
              points: [
                {
                  importance_value: 10,
                  start_date: new Date(2013, 1, 1),
                  end_date: new Date(2013, 1, 1, 23, 59, 59)
                },
                {
                  importance_value: 9,
                  start_date: new Date(2013, 1, 2),
                  end_date: new Date(2013, 1, 2, 23, 59, 59)
                }
              ]
            });
            this.thingSummary.update();
          });
          it("should filter points that are not important", function () {
            this.thingSummary.$(".current-event-name").text().should.equal("1 event");
          });
          it("should show", function () {
            this.thingSummary.$el.css("display").should.equal("block");
          });
          it("should set the name", function () {
            this.thingSummary.$(".name").text().should.equal("thing name");
          });
          it("should set the link", function () {
            this.thingSummary.$(".name a").prop("href").should.equal("http://thing.com/link");
          });
          it("should show the summary", function () {
            this.thingSummary.$(".current-event").text().length.should.be.greaterThan(1);
          });
        });
        describe("already highlighted", function () {
          describe("same amount of points", function () {
            it("should not change the point it is showing", function () {
              this.thingSummary.render();
              this.model.set("highlight", {
                name: "thing name",
                link: "http://thing.com/link",
                points: [
                  {
                    importance_value: 10,
                    start_date: new Date(1950, 0, 1),
                    end_date: new Date(1950, 0, 1, 23, 59, 59),
                    event_name: "event name 1"
                  }, {
                    importance_value: 10,
                    start_date: new Date(1950, 0, 1),
                    end_date: new Date(1950, 0, 1, 23, 59, 59),
                    event_name: "event name 2"
                  }
                ]
              });
              this.thingSummary.update();
              this.thingSummary.showNext();
              this.thingSummary.showNext();
              this.thingSummary.$(".current-event-name").text().should.equal("event name 2");
              this.thingSummary.update();
              this.thingSummary.$(".current-event-name").text().should.equal("event name 2");
            });
          });
          describe("different amount of points", function () {
            it("should reset to the summary", function () {
              this.thingSummary.render();
              this.model.set("highlight", {
                name: "thing name",
                link: "http://thing.com/link",
                points: [
                  {
                    importance_value: 10,
                    start_date: new Date(1950, 0, 1),
                    end_date: new Date(1950, 0, 1, 23, 59, 59),
                    event_name: "event name 1"
                  }, {
                    importance_value: 11,
                    start_date: new Date(1950, 0, 1),
                    end_date: new Date(1950, 0, 1, 23, 59, 59),
                    event_name: "event name 2"
                  }
                ]
              });
              this.thingSummary.update();
              this.thingSummary.showNext();
              this.thingSummary.$(".current-event-name").text().should.equal("event name 1");
              this.model.set("importance", 11);
              this.thingSummary.update();
              this.thingSummary.$(".current-event-name").text().should.equal("1 event");
            });
          });
        });
      });

      describe("date formatting", function () {
        describe("getDateTimeRange", function () {
          it("should return the date with no offset", function () {
            this.thingSummary.getDate({
              start_date: new Date(1950, 0, 1),
              end_date: new Date(1950, 0, 1, 23, 59, 59),
              start_offset_seconds: 0
            }, "start").should.equal("Jan 1 1950");
          });
          it("should return the date with an offset", function () {
            this.thingSummary.getDate({
              start_date: new Date(1950, 0, 1),
              end_date: new Date(1950, 0, 1, 23, 59, 59),
              start_offset_seconds: -1
            }, "start").should.equal("Dec 31 1949");
          });
        });
        describe("getTime", function () {
          it("should return the time with no offset", function () {
            this.thingSummary.getTime({
              start_date: new Date(1950, 0, 1),
              end_date: new Date(1950, 0, 1, 23, 59, 59),
              start_offset_seconds: 0
            }, "start").should.equal("00:00");
          });
          it("should return the time with an offset", function () {
            this.thingSummary.getTime({
              start_date: new Date(1950, 0, 1),
              end_date: new Date(1950, 0, 1, 23, 59, 59),
              start_offset_seconds: -1
            }, "start").should.equal("23:59");
          });
        });
      });

      describe("show point", function () {
        describe("summary", function () {
          describe("multiple events", function () {
            beforeEach(function () {
              this.model.set("highlight", {
                importance: 10,
                name: "thing name",
                link: "http://thing.com/link",
                points: [
                  {
                    importance_value: 10,
                    start_date: new Date(2010, 0, 1),
                    start_offset_seconds: 0,
                    end_date: new Date(2010, 0, 1, 23, 59, 59),
                    end_offset_seconds: 0
                  },
                  {
                    importance_value: 10,
                    start_date: new Date(2011, 3, 2),
                    start_offset_seconds: 0,
                    end_date: new Date(2011, 3, 2, 23, 59, 59),
                    end_offset_seconds: 0
                  }
                ]
              });
              this.model.set("selectedPointIndex", 1);
              this.thingSummary.render();
            });
            it("should show the date range of the thing", function () {
              this.thingSummary.$(".current-date").text().should.equal("Jan 1 2010 – Apr 2 2011");
            });
            it("should show the amount of events", function () {
              this.thingSummary.$(".current-event-name").text().should.equal("2 events");
            });
            it("should unset the selectedPointIndex", function () {
              should.not.exist(this.model.get("selectedPointIndex"));
            });
          });
          describe("single event", function () {
            it("should show the date of the thing if there is a single event", function () {
              this.thingSummary.render();
              this.model.set("highlight", {
                name: "thing name",
                link: "http://thing.com/link",
                points: [
                  {
                    importance_value: 10,
                    start_date: new Date(2010, 0, 1),
                    end_date: new Date(2010, 0, 1, 23, 59, 59),
                    start_offset_seconds: 0
                  }
                ]
              });
              this.thingSummary.update();
              this.thingSummary.$(".current-date").text().should.equal("Jan 1 2010");
            });
          });
          describe("no events", function () {
            beforeEach(function () {
              this.thingSummary.render();
              this.model.set("highlight", {
                name: "thing name",
                link: "http://thing.com/link",
                points: [
                  {
                    importance_value: 9,
                    start_date: new Date(2010, 0, 1),
                    end_date: new Date(2010, 0, 1, 23, 59, 59),
                    start_offset_seconds: 0
                  }
                ]
              });
              this.thingSummary.update();
            });
            it("should show no date", function () {
              this.thingSummary.$(".current-date").text().should.equal("");
            });
            it("should say no events", function () {
              this.thingSummary.$(".current-event-name").text().should.equal("0 events");
            });
          });
        });

        describe("event detail", function () {
          beforeEach(function () {
            this.thingSummary.render();
            this.model.set("highlight", {
              importance: 10,
              name: "thing name",
              link: "http://thing.com/link",
              points: [
                {
                  lat: 10,
                  lon: 20,
                  importance_value: 10,
                  start_date: new Date(2010, 0, 1),
                  start_offset_seconds: 0,
                  end_date: new Date(2011, 0, 1, 23, 59, 59),
                  end_offset_seconds: 0,
                  event_name: "event name 1"
                },
                {
                  lat: 20,
                  lon: 30,
                  importance_value: 10,
                  start_date: new Date(2011, 3, 2),
                  start_offset_seconds: 0,
                  end_date: new Date(2011, 3, 2, 23, 59, 59),
                  end_offset_seconds: 0,
                  event_name: "event name 1"
                },
                {
                  importance_value: 10,
                  start_date: new Date(2011, 3, 2),
                  start_offset_seconds: 0,
                  end_date: new Date(2011, 3, 2, 23, 58),
                  end_offset_seconds: 0,
                  event_name: "event name 1"
                }
              ]
            });
            this.thingSummary.update();
            this.thingSummary.showNext();
          });
          it("should show the date range of the event when it is longer than a day", function () {
            this.thingSummary.$(".current-date").text().should.equal("Jan 1 2010 – Jan 1 2011");
          });
          it("should show the date of the event when it is exactly a day", function () {
            this.thingSummary.showNext();
            this.thingSummary.$(".current-date").text().should.equal("Apr 2 2011");
          });
          it("should show the time of the event when it is shorter than a day", function () {
            this.thingSummary.showNext();
            this.thingSummary.showNext();
            this.thingSummary.$(".current-date").text().should.equal("00:00 – 23:58 Apr 2 2011");
          });
          it("should show the name of the event", function () {
            this.thingSummary.$(".current-event-name").text().should.equal("event name 1");
          });
          it("should set the selectedPointIndex", function () {
            this.model.get("selectedPointIndex").should.equal(0);
            this.thingSummary.showNext();
            this.model.get("selectedPointIndex").should.equal(1);
          });
          it("should reposition the map on first point", function () {
            this.model.get("center").should.eql([10, 20]);
          });
          it("should reposition the map on subsequent point", function () {
            this.thingSummary.showNext();
            this.model.get("center").should.eql([20, 30]);
          });
        });
      });
    });
  }
);