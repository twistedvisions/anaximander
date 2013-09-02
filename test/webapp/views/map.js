/*global sinon, describe, before, after, beforeEach, afterEach, it, google */
define(
  ["jquery", "backbone", "views/map", "analytics", "styled_marker"], 
  function ($, Backbone, Map, Analytics, StyledMarker) {
    var model = new Backbone.Model({
      center: [1, 1],
      date: [1900, 2000],
      zoom: 3
    });

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
      });

      afterEach(function () {
        Analytics.infoBoxShown.restore();
        Analytics.linkClicked.restore();
        StyledMarker.StyledMarker.restore();
        StyledMarker.StyledIcon.restore();
      });

      it("should set lastEvent to 'map'", function () {
        var map = new Map({model: model});
        map.render();
        google.maps.event.triggers[0]();
        window.lastEvent.should.equal("map");
      });

      it("should track when a marker is hovered over", function () {
        var map = new Map({model: model});
        map.render();
        map.drawPoint({
          events: [],
          location: []
        });

        google.maps.event.triggers[1]();

        Analytics.infoBoxShown.calledOnce.should.be.true;
      });

      it("should track when a marker link is clicked on", function () {
        var map = new Map({model: model});

        map.render();
        map.drawPoint({
          events: [],
          location: []
        });

        google.maps.event.triggers[1]();
        
        map.onLinkClick();

        Analytics.linkClicked.calledOnce.should.be.true;
      });
    });
  }
);
