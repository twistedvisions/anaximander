/*global sinon, describe, beforeEach, afterEach, it, google */
/*jshint expr: true*/
define(
  ["chai", "jquery", "backbone", "views/map", "analytics",
   "styled_marker", "views/options_menu", "models/current_user"],
  function (chai, $, Backbone, Map, Analytics,
      StyledMarker, OptionsMenu, CurrentUser) {

    var should = chai.should();

    var userLoggedInWithAddEventPermission = new CurrentUser({
      "logged-in": true,
      permissions: [
        {name: "add-event"}
      ]
    });

    var userLoggedIn = new CurrentUser({
      "logged-in": true
    });

    var userLoggedOut = new CurrentUser({
      "logged-in": false
    });

    var collection = new Backbone.Collection();
    collection.start = function () {};

    describe("interaction", function () {
      beforeEach(function () {
        sinon.stub(Analytics, "infoBoxShown");
        sinon.stub(Analytics, "optionsMenuShown");
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

        this.model = new Backbone.Model({
          center: [1, 1],
          date: [1900, 2000],
          zoom: 3
        });

        this.map = new Map({
          model: this.model,
          user: userLoggedInWithAddEventPermission,
          eventLocationsCollection: collection
        });
        sinon.stub(this.map, "getColor");

      });

      afterEach(function () {
        Analytics.infoBoxShown.restore();
        Analytics.linkClicked.restore();
        Analytics.optionsMenuShown.restore();
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
          events: [{
            distance: 1,
            location: [1, 2]
          }],
          location: []
        });

        google.maps.event.triggers[3]();

        Analytics.infoBoxShown.calledOnce.should.equal(true);
      });

      it("should track when the menu is shown", function () {
        this.clock = sinon.useFakeTimers();
        try {

          this.map.render();
          this.map.onClick();
          this.clock.tick(500);
          Analytics.optionsMenuShown.calledOnce.should.equal(true);
        } finally {
          this.clock.restore();
        }
      });

      it("should close open windows when a marker is hovered over", function () {
        this.map.render();
        this.map.drawPoint({
          events: [],
          location: []
        });

        this.map.closeOpenWindows = sinon.stub();
        google.maps.event.triggers[2]();
        this.map.closeOpenWindows.calledOnce.should.equal(true);
      });

      it("should track when a marker link is clicked on", function () {
        this.map.render();
        this.map.drawPoint({
          events: [{
            distance: 1,
            location: [1, 2]
          }],
          location: []
        });

        google.maps.event.triggers[3]();

        this.map.onLinkClick({target: {}});

        Analytics.linkClicked.calledOnce.should.equal(true);
      });
    });

    describe("drawNewMarkers", function () {
      it("should remove necessary mapobjects");
      it("should add necessary mapobjects");
    });
    describe("redrawMarkers", function () {
      it("should leave the same amount of markers");
      it("should call draw result on each marker");
    });
    describe("updateLocation", function () {
      describe("when the map needs updating", function () {
        it("should pan to the model's center");
        it("should change the zoom if it is set");
        describe("when zoom is -1", function () {
          it("should change the zoom given by the bounds");
          it("should set the zoom on the model");
          it("should delete the bounds from the model");
        });
        it("should set this.locationChanged");
        it("should remember the last position to which it was navigated");
      });
      describe("when the map needs redrawing", function () {
        it("should redraw the markers");
        it("should the last highlighted ids");
      });
    });
    describe("getBounds", function () {
      it("should get the bounds from the map as a nested array");
    });

    describe("mapNeedsUpdating", function () {
      it("needs updating if the center has changed", function () {
        var map = new Map({model: this.model});
        map.getPosition = function () {
          return [1, 1];
        };
        map.getZoom = function () {
          return 3;
        };
        map.mapNeedsUpdating().should.equal(false);
        map.getPosition = function () {
          return [2, 1];
        };
        map.mapNeedsUpdating().should.equal(true);
      });

      it("needs updating if the zoom has changed", function () {
        var map = new Map({model: this.model});
        map.getPosition = function () {
          return [1, 1];
        };
        map.getZoom = function () {
          return 3;
        };
        map.mapNeedsUpdating().should.equal(false);
        map.getZoom = function () {
          return 5;
        };
        map.mapNeedsUpdating().should.equal(true);
      });

      it("needs updating if the date has changed");
    });

    describe("mapNeedsRedrawing", function () {
      it("needs redrawing when highlights have been set");
      it("needs redrawing when highlights have been added");
      it("needs redrawing when highlights have been removed");
    });

    describe("getMarkerText", function () {
      it("should be the number of elements in the marker when there are 2 digits");
      it("should be infinity when there are more than 2 digits");
    });

    describe("isDimmed", function () {
      it("should be dimmed when there are things to highlight, but not in this marker");
      it("should not be dimmed when there are things to highlight that are in this marker");
      it("should not be dimmed when there are no things to highlight");
    });

    describe("info box", function () {
      it("should send summary information to analytics", function () {
        var data = this.map.getInfoBoxData({
          location: [1, 2],
          events: [{
            distance: 3,
            start_date: "1900-01-01T00:00:00.000Z",
            end_date: "1900-01-01T23:59:00.000Z",
            thing_type: "a",
            event_name: "x"
          }, {
            distance: 3,
            start_date: "1950-01-01T00:00:00.000Z",
            end_date: "1950-01-01T23:59:00.000Z",
            thing_type: "a",
            event_name: "y"
          }, {
            distance: 3,
            start_date: "1990-01-01T00:00:00.000Z",
            end_date: "1990-01-01T23:59:00.000Z",
            thing_type: "b",
            event_name: "z"
          }]
        });
        data.distance.should.equal(3);
        data.thingTypes.should.eql(["a", "b"]);
        data.eventNames.should.eql(["x", "y", "z"]);
        data.startDate.should.equal("1900-01-01T00:00:00.000Z");
        data.endDate.should.equal("1990-01-01T23:59:00.000Z");
      });
    });

    describe("marker links", function () {
      it("should contain the event data in the dataset", function () {
        var event = {
          event_name: "some name",
          event_link: "http://something.com/blah",
          start_date: "2013-03-02",
          end_date: "2013-04-03",
          location: [[20, -53]]
        };
        var text = this.map.getEventText(event);
        var el = $(text);
        var dataset = el.data();
        dataset.name.should.equal(event.event_name);
        dataset.link.should.equal(event.event_link);
        dataset.lat.should.equal(event.location[0][0]);
        dataset.lon.should.equal(event.location[0][1]);
        dataset.startDate.should.equal(event.start_date);
        dataset.endDate.should.equal(event.end_date);
      });
    });

    describe("getColor", function () {
      it("should be blue at the most recent end", function () {
        var map = new Map({model: this.model});
        map.getColor({
          events: [{
            start_date: "2000-12-31"
          }]
        }).should.be.equal("#0000ff");
      });
      it("should be red at the most distant end", function () {
        var map = new Map({model: this.model});
        map.getColor({
          events: [{
            start_date: "1900-01-01"
          }]
        }).should.be.equal("#ff0000");
      });
      it("should be a mixture in the middle", function () {
        var map = new Map({model: this.model});
        map.getColor({
          events: [{
            start_date: "1950-05-06"
          }]
        }).should.be.equal("#80007f");
      });
      it("should be washed out if it is dimmed");
    });

    describe("options menu", function () {
      beforeEach(function () {
        sinon.stub(OptionsMenu.prototype);
        this.clock = sinon.useFakeTimers();
      });
      afterEach(function () {
        this.clock.restore();
        sinon.restore(OptionsMenu.prototype);
      });

      it("should show the options menu when the user is logged in and has permission", function () {
        var map = new Map({model: this.model, user: userLoggedInWithAddEventPermission});
        map.onClick();
        this.clock.tick(200);
        OptionsMenu.prototype.render.calledOnce.should.equal(true);
      });


      it("should not show the options menu when the user is logged in and without permission", function () {
        var map = new Map({model: this.model, user: userLoggedIn});
        map.onClick();
        this.clock.tick(200);
        OptionsMenu.prototype.render.calledOnce.should.equal(false);
      });

      it("should not show the options menu when the user is not logged in", function () {
        var map = new Map({model: this.model, user: userLoggedOut});
        map.onClick();
        this.clock.tick(200);
        OptionsMenu.prototype.render.calledOnce.should.equal(false);
      });

      it("should close open windows when it shows the options menu", function () {
        var map = new Map({model: this.model, user: userLoggedInWithAddEventPermission});
        map.closeOpenWindows = sinon.stub();
        map.onClick();
        this.clock.tick(200);
        map.closeOpenWindows.calledOnce.should.equal(true);
      });

      it("should not fire if it was double clicked", function () {
        var map = new Map({model: this.model, user: userLoggedIn});
        map.closeOpenWindows = sinon.stub();
        map.onClick();
        map.onDblClick();
        this.clock.tick(200);
        should.not.exist(map.lastOptionsMenu);
      });

      it("should close open windows if it was double clicked", function () {
        var map = new Map({model: this.model, user: userLoggedIn});
        map.closeOpenWindows = sinon.stub();
        map.onClick();
        map.onDblClick();
        this.clock.tick(200);
        map.closeOpenWindows.calledOnce.should.equal(true);
      });

    });

    describe("closeOpenWindows", function () {

      it("should close an open info boxes", function () {
        var map = new Map({model: this.model, user: userLoggedIn});
        map.lastInfoWindow = {close: sinon.stub()};
        map.closeOpenWindows();
        map.lastInfoWindow.close.calledOnce.should.equal(true);
      });

      it("should close an existing options menu", function () {
        var map = new Map({model: this.model, user: userLoggedIn});
        map.lastOptionsMenu = {close: sinon.stub()};
        map.closeOpenWindows();
        map.lastOptionsMenu.close.calledOnce.should.equal(true);
      });

    });
  }

);
