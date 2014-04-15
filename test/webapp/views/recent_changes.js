/*global sinon, describe, it, beforeEach, afterEach */
define(

  ["underscore", "jquery", "backbone", "when", "analytics", "views/recent_changes"],

  function (_, $, Backbone, when, analytics, RecentChanges) {
    describe("recent changes", function () {
      beforeEach(function () {
        this.historyCollection = new Backbone.Collection([
          {
            date: new Date().toISOString(),
            username: "x",
            new_values: {
              "key1": "aabbcc",
              "key2": "dDeeff"
            }
          },
          {
            date: new Date().toISOString(),
            username: "y",
            new_values: {
              "key1": "aabbdd",
              "key2": "cceeff"
            }
          }
        ]);
        this.recentChanges = new RecentChanges();
        sinon.stub(this.recentChanges, "getRecentChanges", _.bind(function () {
          this.recentChanges.historyCollection = this.historyCollection;
          return when.resolve();
        }, this));
      });
      describe("filtering", function () {
        beforeEach(function () {
          this.recentChanges.render().appendTo($("body"));
        });
        afterEach(function () {
          $("body").remove(".recent-changes");
        });
        it("should filter the table by the input box", function (done) {
          _.defer(_.bind(function () {
            this.recentChanges.$("tbody tr:visible").length.should.equal(4);
            this.recentChanges.$(".filter input").val("dd");
            this.recentChanges.$(".filter input").trigger("keyup");
            this.recentChanges.$("tbody tr:visible").length.should.equal(2);
            done();
          }, this));
        });
        it("should filter the table case insensitively", function (done) {
          _.defer(_.bind(function () {
            this.recentChanges.$("tbody tr:visible").length.should.equal(4);
            this.recentChanges.$(".filter input").val("Dd");
            this.recentChanges.$(".filter input").trigger("keyup");
            this.recentChanges.$("tbody tr:visible").length.should.equal(2);
            done();
          }, this));
        });
        it("should not filter if the input is empty", function (done) {
          _.defer(_.bind(function () {
            this.recentChanges.$("tbody tr:visible").length.should.equal(4);
            this.recentChanges.$(".filter input").val("");
            this.recentChanges.$(".filter input").trigger("keyup");
            this.recentChanges.$("tbody tr:visible").length.should.equal(4);
            done();
          }, this));
        });
        it("should make the top visible row show extra details when filtered", function (done) {
          _.defer(_.bind(function () {
            this.recentChanges.$("tbody tr:visible").length.should.equal(4);
            this.recentChanges.$(".filter input").val("ddeeff");
            this.recentChanges.$(".filter input").trigger("keyup");
            this.recentChanges.$("tbody tr:visible .username span:visible").length.should.equal(1);
            done();
          }, this));
        });
        describe("analytics", function () {
          beforeEach(function () {
            sinon.stub(analytics, "recentChangesViewed");
          });
          afterEach(function () {
            analytics.recentChangesViewed.restore();
          });
          it("should fire off some analytics", function () {
            this.recentChanges.render();
            analytics.recentChangesViewed.calledOnce.should.equal(true);
          });
        });
      });
    });
  }
);