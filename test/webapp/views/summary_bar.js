/*global sinon, describe, beforeEach, afterEach, it */
define(

  ["chai", "backbone", "views/summary_bar", "jquery", "models/current_user", "analytics"],

  function (chai, Backbone, SummaryBar, $, CurrentUser, analytics) {

    var should = chai.should();

    beforeEach(function () {
      $("body").append("<div id='summary-bar'></div>");
      this.model = new Backbone.Model({
        center: [1, 1],
        date: [1900, 2000],
        zoom: 3,
        filterState: new Backbone.Collection()
      });
      this.user = new CurrentUser({
        "logged-in": false
      });

      this.collection = new Backbone.Collection();
    });

    afterEach(function () {
      $("#summary-bar").remove();
    });

    describe("interaction", function () {
      beforeEach(function () {
        this.clock = sinon.useFakeTimers();
        this.summaryBar = new SummaryBar({
          model: this.model,
          user: this.user,
          eventLocationsCollection: this.collection
        });
        this.summaryBar.render();
        this.clock.tick(200);
        sinon.stub(this.summaryBar.placeSelector, "select2", function () {
          return 2;
        });
        sinon.stub(analytics, "periodSelectorOpened");
        sinon.stub(analytics, "periodSelected");
      });
      afterEach(function () {
        this.summaryBar.placeSelector.select2.restore();
        this.clock.restore();
        analytics.periodSelectorOpened.restore();
        analytics.periodSelected.restore();
      });
      it("should track users clicking on the period selector", function () {
        this.summaryBar.placeSelectorOpened();
        analytics.periodSelectorOpened.calledOnce.should.equal(true);
      });
      it("should track users selecting a period", function () {
        this.summaryBar.handleChange();
        analytics.periodSelected.calledOnce.should.equal(true);
      });

      it("should set lastEvent to 'period_selector'", function () {
        this.summaryBar.handleChange();
        window.lastEvent.should.equal("period_selector");
      });
    });

    describe("results", function () {

      var results = [[1, 2], [3]];

      it("should show the correct amount of locations", function () {
        var summaryBar = new SummaryBar({
          model: this.model,
          user: this.user,
          eventLocationsCollection: this.collection
        });
        summaryBar.getLocationCount(results).should.equal(2);
      });

      it("should show the correct amount of events", function () {
        var summaryBar = new SummaryBar({
          model: this.model,
          user: this.user,
          eventLocationsCollection: this.collection
        });

        summaryBar.getEventCount(results).should.equal(3);
      });
    });

    describe("filter button", function () {
      it("should not be highlighted when there are no filters selected", function () {
        var summaryBar = new SummaryBar({
          model: this.model,
          user: this.user,
          eventLocationsCollection: this.collection
        });
        summaryBar.render();
        summaryBar.$("#filter-toggle").hasClass("highlight").should.equal(false);
      });
      it("should be highlighted when there are filters selected", function () {
        this.model.get("filterState").reset({id: 1});
        var summaryBar = new SummaryBar({
          model: this.model,
          user: this.user,
          eventLocationsCollection: this.collection
        });
        summaryBar.render();
        summaryBar.$("#filter-toggle").hasClass("highlight").should.equal(true);
      });
    });

    describe("login", function () {
      it("should not show if the user does not have the permission", function () {
        var summaryBar = new SummaryBar({
          model: this.model,
          user: this.user,
          eventLocationsCollection: this.collection
        });
        summaryBar.render();
        should.not.exist(summaryBar.login);
      });
      it("should show if the user if the user has permission", function () {
        this.userWhoCanLogin = new CurrentUser({
          "logged-in": false,
          permissions: [
            {id: 1, name: "login"}
          ]
        });
        var summaryBar = new SummaryBar({
          model: this.model,
          user: this.userWhoCanLogin,
          eventLocationsCollection: this.collection
        });
        summaryBar.render();
        should.exist(summaryBar.login);
      });
    });
  }
);
