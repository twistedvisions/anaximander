/*global sinon, describe, beforeEach, afterEach, it, google */
/*jshint expr: true*/
define(
  ["jquery", "backbone", "views/map", "analytics", "styled_marker", "views/options_menu"], 
  function ($, Backbone, Map, Analytics, StyledMarker, OptionsMenu) {
    var model = new Backbone.Model({
      center: [1, 1],
      date: [1900, 2000],
      zoom: 3
    });    
    var userLoggedIn = new Backbone.Model({
      "logged-in": true
    });
    var userLoggedOut = new Backbone.Model({
      "logged-in": false
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
          eventLocationsCollection: collection
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

        google.maps.event.triggers[2]();

        Analytics.infoBoxShown.calledOnce.should.equal(true);
      });

      it("should track when a marker link is clicked on", function () {
        this.map.render();
        this.map.drawPoint({
          events: [],
          location: []
        });

        google.maps.event.triggers[2]();
        
        this.map.onLinkClick();

        Analytics.linkClicked.calledOnce.should.equal(true);
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

    describe("options menu", function () {
      beforeEach(function () {
        sinon.stub(OptionsMenu.prototype);
      });
      afterEach(function () {
        sinon.restore(OptionsMenu.prototype);
      });

      it("should show the options menu when the user is logged in", function () {
        var map = new Map({model: model, user: userLoggedIn});
        map.onClick();
        OptionsMenu.prototype.render.calledOnce.should.equal(true);
      });
      it("should not show the options menu when the user is not logged in", function () {
        var map = new Map({model: model, user: userLoggedOut});
        map.onClick();
        OptionsMenu.prototype.render.calledOnce.should.equal(false);
      });
    });
  }
);
