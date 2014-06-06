/*global sinon, describe, it, beforeEach, afterEach */
define(

  ["jquery", "backbone", "views/thing_summary"],

  function ($, Backbone, ThingSummary) {
    describe.only("thing summary", function () {
      beforeEach(function () {
        this.model = new Backbone.Model({
          importance: 10
        });
        this.thingSummary = new ThingSummary({model: this.model, el: null});
      });
      afterEach(function () {

      });
      describe("interaction", function () {
        beforeEach(function () {
          sinon.stub(this.thingSummary, "showPoint");
        });
        describe("previous button", function () {
          it("should decrement the index when the previous button is shown.", function () {
            this.thingSummary.index = 2;
            this.thingSummary.showPrevious();
            this.thingSummary.index.should.equal(1);
          });
          it("should wrap around if the index is less than -1", function () {
            this.thingSummary.points = [1, 2, 3];
            this.thingSummary.index = -1;
            this.thingSummary.showPrevious();
            this.thingSummary.index.should.equal(2);
          });
          it("should change the bounds to the highlighted position");
        });
        describe("next button", function () {
          it("should increment the index when the next button is shown.", function () {
            this.thingSummary.points = [1, 2, 3];
            this.thingSummary.index = 1;
            this.thingSummary.showNext();
            this.thingSummary.index.should.equal(2);
          });
          it("should wrap around to -1 if the index is more than the amount of points", function () {
            this.thingSummary.points = [1, 2, 3];
            this.thingSummary.index = 2;
            this.thingSummary.showNext();
            this.thingSummary.index.should.equal(-1);
          });
          it("should change the bounds to the highlighted position");
        });
      });
      describe("filter points", function () {
        it("should filter events by importance", function () {
          this.model.set("importance", 10);
          this.thingSummary.filterPoints([
            {
              importance_value: 9
            },
            {
              importance_value: 10
            },
            {
              importance_value: 11
            }
          ]).length.should.equal(2);
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
                  date: new Date(2013, 1, 1)
                },
                {
                  importance_value: 9,
                  date: new Date(2013, 1, 2)
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
                    event_name: "event name 1"
                  }, {
                    importance_value: 10,
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
                    event_name: "event name 1"
                  }, {
                    importance_value: 11,
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
      describe("show point", function () {
        describe("summary", function () {
          describe("multiple events", function () {
            beforeEach(function () {
              this.thingSummary.render();
              this.model.set("highlight", {
                importance: 10,
                name: "thing name",
                link: "http://thing.com/link",
                points: [
                  {
                    importance_value: 10,
                    date: new Date(2010, 0, 1)
                  },
                  {
                    importance_value: 10,
                    date: new Date(2011, 3, 2)
                  }
                ]
              });
              this.thingSummary.update();
            });
            it("should show the date range of the thing if there multiple events", function () {
              this.thingSummary.$(".current-date").text().should.equal("Jan 1 2010 - Apr 2 2011");
            });
            it("should show the amount of events", function () {
              this.thingSummary.$(".current-event-name").text().should.equal("2 events");
            });
            it("should show the amount of events at the current importance level");
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
                    date: new Date(2010, 0, 1)
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
                    date: new Date(2010, 0, 1)
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
                  importance_value: 10,
                  date: new Date(2010, 0, 1),
                  event_name: "event name 1"
                }, {

                  importance_value: 10,
                  date: new Date(2011, 3, 2),
                  event_name: "event name 1"
                }
              ]
            });
            this.thingSummary.update();
            this.thingSummary.showNext();
          });
          it("should show the date of the event", function () {
            this.thingSummary.$(".current-date").text().should.equal("Jan 1 2010 12:00 AM");
          });
          it("should show the name of the event", function () {
            this.thingSummary.$(".current-event-name").text().should.equal("event name 1");
          });
        });
      });
    });
  }
);