/*global sinon, describe, beforeEach, afterEach, it */
define(

  ["backbone", "views/summary_bar", "jquery"], 

  function (Backbone, SummaryBar, $) {

    beforeEach(function () {
      $("body").append("<div id='summary-bar'></div>");
      this.model = new Backbone.Model({
        center: [1, 1],
        date: [1900, 2000],
        zoom: 3,
        filterState: new Backbone.Collection()
      });

      this.collection = new Backbone.Collection();
    });

    afterEach(function () {
      $("body").remove("#summary-bar");
    });

    describe("interaction", function () {
      it("should set lastEvent to 'period_selector'", function () {
        var clock = sinon.useFakeTimers();
        var summaryBar = new SummaryBar({
          model: this.model,
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
          eventLocationsCollection: this.collection
        });    
        summaryBar.getLocationCount(results).should.equal(2);
      });

      it("should show the correct amount of events", function () {
        var summaryBar = new SummaryBar({
          model: this.model,
          eventLocationsCollection: this.collection
        });    
        
        summaryBar.getEventCount(results).should.equal(3);
      });
    });

    describe("filter button", function () {
      it("should not be highlighted when there are no filters selected", function () {
        var summaryBar = new SummaryBar({
          model: this.model,
          eventLocationsCollection: this.collection
        }); 
        summaryBar.render();
        summaryBar.$("#filter-toggle").hasClass("highlight").should.equal(false);
      });
      it("should be highlighted when there are filters selected", function () {
        this.model.get("filterState").reset({id: 1});
        var summaryBar = new SummaryBar({
          model: this.model,
          eventLocationsCollection: this.collection
        });
        summaryBar.render();
        summaryBar.$("#filter-toggle").hasClass("highlight").should.equal(true);
      });
    });
  }
);
