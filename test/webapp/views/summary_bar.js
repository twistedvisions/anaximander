/*global sinon, describe, before, after, beforeEach, afterEach, it */
define(

  ["backbone", "views/summary_bar"], 

  function (Backbone, SummaryBar) {

    var model = new Backbone.Model({
      center: [1, 1],
      date: [1900, 2000],
      zoom: 3
    });

    var collection = new Backbone.Collection();

    describe("interaction", function () {
      it("should set lastEvent to 'period_selector'", function () {
        var clock = sinon.useFakeTimers();
        var summaryBar = new SummaryBar({
          model: model,
          eventsCollection: collection
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
          model: model,
          eventsCollection: collection
        });    
        summaryBar.getLocationCount(results).should.equal(2);
      });

      it("should show the correct amount of events", function () {
        var summaryBar = new SummaryBar({
          model: model,
          eventsCollection: collection
        });    
        
        summaryBar.getEventCount(results).should.equal(3);
      });
    });
  }
);
