/*global sinon, describe, before, after, beforeEach, afterEach, it, google */
define(
  ["jquery", "backbone", "views/map", "analytics", "styled_marker"], 
  function ($, Backbone, Map, Analytics, StyledMarker) {
    var model = new Backbone.Model({
      center: [1, 1],
      date: [1900, 2000],
      zoom: 3
    });
    var collection = new Backbone.Collection();
    collection.start = function () {};

    describe("interaction", function () {
      beforeEach(function () {
        sinon.stub(Analytics, "infoBoxShown");
        sinon.stub(Analytics, "linkClicked");

        sinon.stub(StyledMarker, "StyledMarker", function () {
          return {
            set: function () {}
          };
        });
        sinon.stub(StyledMarker, "StyledIcon", function () {
          return {
            set: function () {}
          };
        });
        google.maps.event.triggers = [];

        this.map = new Map({
          model: model,
          eventsCollection: collection
        });
        sinon.stub(this.map, "getColor");

      });

      afterEach(function () {
        Analytics.infoBoxShown.restore();
        Analytics.linkClicked.restore();
        StyledMarker.StyledMarker.restore();
        StyledMarker.StyledIcon.restore();
      });
        

      it("should set lastEvent to 'map'", function () {
        this.map.render();
        google.maps.event.triggers[0]();
        window.lastEvent.should.equal("map");
      });

      it("should track when a marker is hovered over", function () {
        this.map.render();
        this.map.drawPoint({
          events: [],
          location: []
        });

        google.maps.event.triggers[1]();

        Analytics.infoBoxShown.calledOnce.should.be.true;
      });

      it("should track when a marker link is clicked on", function () {
        this.map.render();
        this.map.drawPoint({
          events: [],
          location: []
        });

        google.maps.event.triggers[1]();
        
        this.map.onLinkClick();

        Analytics.linkClicked.calledOnce.should.be.true;
      });
    });

    describe("getColor", function () {
      it("should be blue at the most recent end", function () {
        var map = new Map({model: model});
        map.getColor({
          events: [{
            start_date: "2000-12-31"
          }]
        }).should.be.equal("#0000ff");
      });
      it("should be red at the most distant end", function () {
        var map = new Map({model: model});
        map.getColor({
          events: [{
            start_date: "1900-01-01"
          }]
        }).should.be.equal("#ff0000");
      });
      it("should be a mixture in the middle", function () {
        var map = new Map({model: model});
        map.getColor({
          events: [{
            start_date: "1950-05-06"
          }]
        }).should.be.equal("#80007f");
      });
    });
  }
);
