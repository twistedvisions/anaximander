/*global sinon, describe, beforeEach, afterEach, it */
define(

  ["chai", "backbone", "views/summary_bar", "jquery", "models/current_user"], 

  function (chai, Backbone, SummaryBar, $, CurrentUser) {

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
      it("should set lastEvent to 'period_selector'", function () {
        var clock = sinon.useFakeTimers();
        var summaryBar = new SummaryBar({
          model: this.model,
          user: this.user,
          eventLocationsCollection: this.collection
        });    
        summaryBar.render();
        clock.tick(200);
        sinon.stub(summaryBar.placeSelector, "select2", function () {
          return 2;
        });
        summaryBar.handleChange();
        window.lastEvent.should.equal("period_selector");
        summaryBar.placeSelector.select2.restore();
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
