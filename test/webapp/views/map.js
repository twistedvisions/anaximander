/*global sinon, describe, beforeEach, afterEach, it, google */
/*jshint expr: true*/
define(
  ["chai", "jquery", "underscore", "backbone", "views/map", "analytics",
   "styled_marker", "views/options_menu", "models/current_user"],
  function (chai, $, _, Backbone, Map, Analytics,
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
    describe("map", function () {

      beforeEach(function () {
        this.model = new Backbone.Model({
          center: [1, 1],
          date: [1900, 2000],
          zoom: 3
        });
        this.map = new Map({model: this.model});
      });

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

          this.map = new Map({
            model: this.model,
            user: userLoggedInWithAddEventPermission,
            eventLocationsCollection: collection
          });
          sinon.stub(this.map, "getColor");
          sinon.stub(this.map, "updateLocation");
        });

        afterEach(function () {
          Analytics.infoBoxShown.restore();
          Analytics.linkClicked.restore();
          Analytics.optionsMenuShown.restore();
          StyledMarker.StyledMarker.restore();
          StyledMarker.StyledIcon.restore();
          this.map.updateLocation.restore();
          this.map.getColor.restore();
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

      describe("marker manipulation", function () {

        beforeEach(function () {

          this.map = new Map({
            model: this.model,
            user: userLoggedInWithAddEventPermission,
            eventLocationsCollection: collection
          });
          this.mapObject = {
            setMap: function () {}
          };
          this.newMapObject = {
            setMap: function () {}
          };
          sinon.stub(this.map, "drawResult", _.bind(function () {
            return this.newMapObject;
          }, this));

          sinon.stub(this.mapObject, "setMap");
          sinon.stub(this.newMapObject, "setMap");
        });
        afterEach(function () {
          this.map.drawResult.restore();
        });
        describe("drawNewMarkers", function () {
          it("should remove necessary mapobjects", function () {
            this.map.mapObjects = {
              remove_key: this.mapObject
            };
            this.map.drawNewMarkers([["remove_key"], []]);
            this.mapObject.setMap.calledWith(null).should.equal(true);
            (this.map.mapObjects.remove_key === undefined).should.equal(true);
          });
          it("should add necessary mapobjects", function () {
            var key = "{\"key\": \"value\"}";
            this.map.drawNewMarkers([[], [key]]);
            this.map.drawResult.calledOnce.should.equal(true);
            this.map.drawResult.calledWith(JSON.parse(key)).should.equal(true);
            this.map.mapObjects[key].should.equal(this.newMapObject);
          });
        });
        describe("redrawMarkers", function () {
          beforeEach(function () {
            this.key = "{\"key\": \"value\"}";
            this.map.mapObjects = {};
            this.map.mapObjects[this.key] = this.mapObject;
          });
          it("should leave the same amount of markers", function () {
            this.map.redrawMarkers();
            _.size(this.map.mapObjects).should.equal(1);

          });
          it("should call draw result on each marker", function () {
            this.map.redrawMarkers();
            _.values(this.map.mapObjects).should.eql([this.newMapObject]);
          });
          it("should clear the maps from the removed markers", function () {
            this.map.redrawMarkers();
            this.mapObject.setMap.calledWith(null).should.equal(true);
          });
          it("should set the maps on the new markers", function () {
            this.map.map = "someMap";
            this.map.redrawMarkers();
            this.newMapObject.setMap.calledWith("someMap").should.equal(true);
          });
        });
      });
      describe("updateLocation", function () {

        beforeEach(function () {

          this.map = new Map({
            model: this.model,
            user: userLoggedInWithAddEventPermission,
            eventLocationsCollection: collection
          });

          this.map.map = {
            panTo: sinon.stub(),
            getCenter: sinon.stub(),
            getZoom: sinon.stub(),
            setZoom: sinon.stub(),
            fitBounds: sinon.stub()
          };
          this.map.map.getCenter.returns({
            lat: function () { return 15; },
            lng: function () { return -25; }
          });

        });

        describe("when the map needs updating", function () {
          beforeEach(function () {

            sinon.stub(this.map, "mapNeedsUpdating", function () {
              return true;
            });
            sinon.stub(this.map, "mapNeedsRedrawing", function () {
              return false;
            });
          });
          it("should pan to the model's center if its different", function () {
            this.map.updateLocation();
            this.map.map.panTo.calledWith(
              new google.maps.LatLng(
                this.model.get("center")[0],
                this.model.get("center")[1]
              )
            ).should.equal(true);
          });
          it("should not pan to the model's center if its the same", function () {
            this.model.set("center", [15, -25]);
            this.map.updateLocation();
            this.map.map.panTo.calledOnce.should.equal(false);
          });
          it("should change the zoom if it is set and different", function () {
            this.map.updateLocation();
            this.map.map.setZoom.calledWith(3).should.equal(true);
          });
          it("should not change the zoom if it is set but the same", function () {
            this.map.map.getZoom.returns(3);
            this.map.updateLocation();
            this.map.map.setZoom.calledOnce.should.equal(false);
          });
          describe("when zoom is -1", function () {
            beforeEach(function () {
              this.model.set("zoom", -1);
              this.model.set("bounds", [{
                lat: 10,
                lon: -20
              }, {
                lat: -30,
                lon: 40
              }]);
            });
            it("should set the bounds of the map", function () {
              this.map.updateLocation();
              this.map.map.fitBounds.calledOnce.should.equal(true);
            });
            it("should change the zoom of the model from the map", function () {
              this.map.map.getZoom.returns(5);
              this.map.map.fitBounds = _.bind(function () {
                this.map.map.getZoom.returns(3);
              }, this);
              this.map.updateLocation();
              this.model.get("zoom").should.equal(3);
            });
            it("should delete the bounds from the model", function () {
              this.map.map.getZoom.returns(5);
              this.map.map.fitBounds = _.bind(function () {
                this.map.map.getZoom.returns(3);
              }, this);
              this.map.updateLocation();
              (this.model.get("bounds") === null).should.equal(true);
            });
          });
          it("should set this.locationChanged", function () {
            this.map.locationChanged = false;
            this.map.updateLocation();
            this.map.locationChanged.should.equal(true);
          });
          it("should remember the last position to which it was navigated", function () {
            this.map.lastModelPosition = null;
            this.map.updateLocation();
            this.map.lastModelPosition.should.eql(this.map.getModelPosition());
          });
        });
        describe("when the map needs redrawing", function () {
          beforeEach(function () {
            sinon.stub(this.map, "mapNeedsUpdating", function () {
              return false;
            });
            sinon.stub(this.map, "mapNeedsRedrawing", function () {
              return true;
            });
            sinon.stub(this.map, "redrawMarkers");
            this.map.model.set("highlights", [1]);
          });
          it("should redraw the markers", function () {
            this.map.updateLocation();
            this.map.redrawMarkers.calledOnce.should.equal(true);
          });
          it("should the last highlighted ids", function () {
            this.map.updateLocation();
            this.map.lastHighlights.should.eql([1]);
          });
        });
      });
      describe("getBounds", function () {
        it("should get the bounds from the map as a nested array", function () {
          this.map.map = {
            getBounds: function () {
              return {
                getNorthEast: function () {
                  return {
                    lat: function () { return  10; },
                    lng: function () { return -20; }
                  };
                },
                getSouthWest: function () {
                  return {
                    lat: function () { return -30; },
                    lng: function () { return  40; }
                  };
                }
              };
            }
          };
          this.map.getBounds().should.eql([[10, -20], [-30, 40]]);
        });
      });

      describe("mapNeedsUpdating", function () {
        it("needs updating if the center has changed", function () {
          this.map.lastModelPosition = {
            center: [1, 1],
            date: [1900, 2000],
            zoom: 3
          };
          this.map.mapNeedsUpdating().should.equal(false);
          this.map.lastModelPosition = {
            center: [2, 1],
            date: [1900, 2000],
            zoom: 3
          };
          this.map.mapNeedsUpdating().should.equal(true);
        });

        it("needs updating if the zoom has changed", function () {
          this.map.lastModelPosition = {
            center: [1, 1],
            date: [1900, 2000],
            zoom: 3
          };
          this.map.mapNeedsUpdating().should.equal(false);
          this.map.lastModelPosition = {
            center: [1, 1],
            date: [1900, 2000],
            zoom: 4
          };
          this.map.mapNeedsUpdating().should.equal(true);
        });

        it("needs updating if the start date has changed", function () {
          this.map.lastModelPosition = {
            center: [1, 1],
            date: [1900, 2000],
            zoom: 3
          };
          this.map.mapNeedsUpdating().should.equal(false);
          this.map.lastModelPosition = {
            center: [1, 1],
            date: [1901, 2000],
            zoom: 4
          };
          this.map.mapNeedsUpdating().should.equal(true);
        });

        it("needs updating if the end date has changed", function () {
          this.map.lastModelPosition = {
            center: [1, 1],
            date: [1900, 2000],
            zoom: 3
          };
          this.map.mapNeedsUpdating().should.equal(false);
          this.map.lastModelPosition = {
            center: [1, 1],
            date: [1900, 2001],
            zoom: 4
          };
          this.map.mapNeedsUpdating().should.equal(true);
        });
      });

      describe("mapNeedsRedrawing", function () {
        it("needs redrawing when highlights have been set", function () {
          this.map.model.set("highlights", [1]);
          this.map.lastHighlights = null;
          this.map.mapNeedsRedrawing().should.equal(true);
        });
        it("needs redrawing when highlights have been added", function () {
          this.map.model.set("highlights", [1, 2]);
          this.map.lastHighlights = [1];
          this.map.mapNeedsRedrawing().should.equal(true);
        });
        it("needs redrawing when highlights have been removed", function () {
          this.map.model.set("highlights", []);
          this.map.lastHighlights = [1];
          this.map.mapNeedsRedrawing().should.equal(true);
        });
        it("does not need redrawing when highlights are the same", function () {
          this.map.model.set("highlights", [1]);
          this.map.lastHighlights = [1];
          this.map.mapNeedsRedrawing().should.equal(true);
        });
      });

      describe("getMarkerText", function () {
        it("should be the number of elements in the marker when there are 2 digits", function () {
          this.map.getMarkerText(_.times(99)).should.equal("99");
        });
        it("should be infinity when there are more than 2 digits", function () {
          this.map.getMarkerText(_.times(100)).should.equal("∞");
        });
      });

      describe("isDimmed", function () {
        it("should be dimmed when there are things to highlight, but not in this marker", function () {
          this.model.set("highlights", [1]);
          this.map.isDimmed([{thing_id: 2}]).should.equal(true);
        });
        it("should be dimmed when there are places to highlight, but not in this marker", function () {
          this.model.set("highlights", [1]);
          this.map.isDimmed([{place_thing_id: 2}]).should.equal(true);
        });
        it("should not be dimmed when there are things to highlight that are in this marker", function () {
          this.model.set("highlights", [1]);
          this.map.isDimmed([{thing_id: 1}]).should.equal(false);
        });
        it("should not be dimmed when there are places to highlight that are in this marker", function () {
          this.model.set("highlights", [1]);
          this.map.isDimmed([{place_thing_id: 1}]).should.equal(false);
        });
        it("should not be dimmed when there are no things to highlight", function () {
          this.model.set("highlights", []);
          this.map.isDimmed([{place_thing_id: 1}]).should.equal(false);
        });
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
          }).should.be.equal("#0000fe");
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
          }).should.be.equal("#80007e");
        });
        it("should be washed out if it is dimmed", function () {
          var map = new Map({model: this.model});
          map.getColor({
            events: [{
              start_date: "1900-01-01"
            }]
          }, true).should.be.equal("#ff9f79");
        });
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
    });
  }

);
