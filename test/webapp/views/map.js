/*global sinon, describe, beforeEach, afterEach, it, google */
/*jshint expr: true*/
define(
  ["chai", "jquery", "underscore", "backbone", "views/map", "analytics",
   "styled_marker", "views/options_menu", "models/current_user",
   "utils/scroll"],
  function (chai, $, _, Backbone, Map, Analytics,
      StyledMarker, OptionsMenu, User, Scroll) {

    var should = chai.should();

    var userLoggedInWithAddEventPermission = new User({
      "logged-in": true,
      permissions: [
        {name: "add-event"}
      ]
    });

    var userLoggedIn = new User({
      "logged-in": true
    });

    var userLoggedOut = new User({
      "logged-in": false
    });

    var collection = new Backbone.Collection();
    collection.start = function () {};
    describe("map", function () {

      beforeEach(function () {
        this.sampleEvent = {
          distance: 1,
          event_id: 1,
          creator_user_id: 101,
          event_last_edited: "2013-01-01",
          event_link: "somelink",
          event_name: "some event",
          thing_name: "some thing",
          place_thing_name: "some place",
          place_thing_link: "http://somelink.com",
          start_date: "2014-01-01T01:00:00.000Z",
          end_date: "2014-01-01T23:00:00.000Z",
          participants: [{
            thing_id: 123,
            thing_link: "http://somewhere.com"
          }],
          location: [1, 2]
        };
        this.model = new Backbone.Model({
          center: [1, 1],
          date: [1900, 2000],
          zoom: 3,
          highlight: {}
        });
        this.map = new Map({
          model: this.model,
          eventLocationsCollection: new (Backbone.Collection.extend({
            start: function () {}
          }))()
        });
        this.map.user = {
          get: function () {
            return true;
          },
          hasPermission: function () {
            return true;
          }
        };
        this.mockMap = function (opts) {
          this.map.map = _.extend({
            panTo: sinon.stub(),
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
            },
            getCenter: function () {
              return {
                lat: function () { return -10; },
                lng: function () { return  10; }
              };
            },
            setCenter: sinon.stub(),
            getZoom: sinon.stub(),
            setZoom: sinon.stub(),
            fitBounds: sinon.stub()
          }, opts || {});
        };
      });
      describe("interaction", function () {
        beforeEach(function () {
          sinon.stub(Analytics, "infoWindowShown");
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

          User.user = userLoggedInWithAddEventPermission;
          this.map = new Map({
            model: this.model,
            eventLocationsCollection: collection
          });
          sinon.stub(this.map, "getColor");
          sinon.stub(this.map, "updateLocation");
        });

        afterEach(function () {
          Analytics.infoWindowShown.restore();
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

        it("should force an update when the force-change event occurs on the model", function () {
          this.map.forceUpdate = sinon.stub();
          this.map.render();
          this.map.model.trigger("force-change");
          this.map.forceUpdate.calledOnce.should.equal(true);
        });
        describe("markers", function () {

          it("should close open windows when a marker is hovered over", function () {
            this.map.render();
            this.map.drawPoint({
              events: [this.sampleEvent],
              location: []
            });

            this.map.closeOpenWindows = sinon.stub();
            google.maps.event.triggers[2]();
            this.map.closeOpenWindows.calledOnce.should.equal(true);
          });

          it("should show a summary", function () {
            sinon.stub(this.map, "getInfoWindowSummary");
            sinon.stub(this.map, "getInfoWindowData");
            this.map.showInfoWindow(null, {});
            this.map.getInfoWindowSummary.calledOnce.should.equal(true);
          });

          it("should show an entry for each event", function () {
            sinon.stub(this.map, "getInfoWindowSummary");
            sinon.stub(this.map, "getInfoWindowEntry");
            sinon.stub(this.map, "getInfoWindowData");
            this.map.showInfoWindow(null, {events: [{}, {}]});
            this.map.getInfoWindowEntry.calledTwice.should.equal(true);
          });

          it("should call onLinkClick when a link is clicked", function () {
            var el = $("<div class='event-entry'><div class='event-link'>aaa</div></div>");
            sinon.stub(this.map, "onLinkClick");
            try {
              el.appendTo(document.body);
              this.map.afterShowInfoWindow();
              el.find(".event-link").click();
              this.map.onLinkClick.calledOnce.should.equal(true);
            } finally {
              el.remove();
            }
          });
          it("should call onSearchClick when the search button is clicked", function () {
            var el = $("<div class='event-entry'><div class='search'></div></div>");
            sinon.stub(this.map, "onSearchClick");
            try {
              el.appendTo(document.body);
              this.map.afterShowInfoWindow();
              el.find(".search").click();
              this.map.onSearchClick.calledOnce.should.equal(true);
            } finally {
              el.remove();
            }
          });
          it("should call onEditClick when the edit button is clicked", function () {
            var el = $("<div class='event-entry'><div class='edit'></div></div>");
            sinon.stub(this.map, "onEditClick");
            try {
              el.appendTo(document.body);
              this.map.afterShowInfoWindow();
              el.find(".edit").click();
              this.map.onEditClick.calledOnce.should.equal(true);
            } finally {
              el.remove();
            }
          });

          it("should call onDeleteClick when the delete button is clicked", function () {
            var el = $("<div class='event-entry'><div class='delete'></div></div>");
            sinon.stub(this.map, "onDeleteClick");
            try {
              el.appendTo(document.body);
              this.map.afterShowInfoWindow();
              el.find(".delete").click();
              this.map.onDeleteClick.calledOnce.should.equal(true);
            } finally {
              el.remove();
            }
          });
          it("should confirm whether the user wants to delete the event", function () {
            sinon.stub(this.map, "confirmDelete");
            try {
              this.map.onDeleteClick();
              this.map.confirmDelete.calledOnce.should.equal(true);
            } finally {
              this.map.confirmDelete.restore();
            }
          });
          it("should update the highlight of the model if the deleted event was highlighted", function () {
            this.map.model.set("highlight", {id: 2});
            this.map.handleDeleteSuccess({
              participants: [{thingId: 1}, {thingId: 2}]
            });
            this.map.model.get("highlight").reset.should.equal(true);
          });

          it("should track when a marker is hovered over", function () {
            this.clock = sinon.useFakeTimers();

            this.map.render();
            this.map.drawPoint({
              events: [this.sampleEvent],
              location: []
            });

            google.maps.event.triggers[3]();
            this.clock.tick(1000);

            Analytics.infoWindowShown.calledOnce.should.equal(true);
          });

          it("should track when a marker link is clicked on", function () {
            this.map.render();
            this.map.drawPoint({
              events: [this.sampleEvent],
              location: []
            });

            google.maps.event.triggers[3]();

            this.map.onLinkClick({target: {}});

            Analytics.linkClicked.calledOnce.should.equal(true);
          });

          it("should track when a marker search is clicked on", function () {
            try {
              sinon.stub(Analytics, "mapEntrySearched");
              var data = {someKey: "some value"};
              sinon.stub(this.map, "getMarkerData", function () {
                return data;
              });
              this.map.onSearchClick();
              Analytics.mapEntrySearched.calledWith(data).should.equal(true);
            } finally {
              Analytics.mapEntrySearched.restore();
            }
          });

          it("should track when a marker edit is clicked on", function () {
            try {
              sinon.stub(Analytics, "mapEntryEdited");
              var data = {someKey: "some value"};
              sinon.stub(this.map, "getMarkerData", function () {
                return data;
              });
              sinon.stub(this.map, "createEventEditor");
              this.map.onEditClick();
              Analytics.mapEntryEdited.calledWith(data).should.equal(true);
            } finally {
              Analytics.mapEntryEdited.restore();
            }
          });

          it("should scroll the highlighted result into view", function () {
            var el;
            try {
              el = $("<div class='event-entry' data-thing-id='123'></div>");
              el.appendTo(document.body);
              sinon.stub(Scroll, "intoView");
              this.map.render();
              this.map.model.set("highlight", {id: 123});
              this.map.afterShowInfoWindow();
              Scroll.intoView.calledOnce.should.equal(true);
            } finally {
              Scroll.intoView.restore();
              el.remove();
            }
          });
        });
      });

      describe("onSearchClick", function () {
        it("should set the model query to the event's thing's name", function () {
          sinon.stub(this.map, "getMarkerData", function () {
            return {
              thingName: "thing name"
            };
          });
          this.map.onSearchClick();

          this.model.get("query").should.equal("thing name");
        });
        it("should set the model's highlight to the event's thing's id", function () {
          sinon.stub(this.map, "getMarkerData", function () {
            return {
              thingId: 1234
            };
          });
          this.map.onSearchClick();

          this.model.get("highlight").id.should.equal(1234);
        });
        it("should set the reset flag on the model's highlight", function () {
          sinon.stub(this.map, "getMarkerData", function () {
            return {
              thingId: 1234
            };
          });
          this.map.onSearchClick();

          this.model.get("highlight").reset.should.equal(true);
        });
      });

      describe("marker manipulation", function () {

        beforeEach(function () {
          User.user = userLoggedInWithAddEventPermission;
          this.map = new Map({
            model: this.model,
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
              "{\"remove_key\": 1}": this.mapObject
            };
            this.map.drawNewMarkers([["{\"remove_key\": 1}"], []]);
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
          describe("selectedEvent", function () {
            beforeEach(function () {
              sinon.stub(this.map, "showInfoWindow");
            });
            afterEach(function () {
              this.map.showInfoWindow.restore();
            });
            it("should show the marker", function () {
              this.map.selectedEvent = {
                id: 205,
                place_id: 103
              };
              this.map.drawNewMarkers([[], ["{\"place_id\": 103}"]]);
              this.map.showInfoWindow.calledOnce.should.equal(true);
            });
            it("should redraw the marker when it has been shown before", function () {
              this.map.selectedEvent = {
                id: 205,
                place_id: 103
              };
              this.map.lastEventIdShown = 205;
              this.map.drawNewMarkers([[], ["{\"place_id\": 103}"]]);
              this.map.showInfoWindow.calledOnce.should.equal(true);
            });
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
          it("should show the highlight", function () {
            sinon.stub(this.map, "showHighlight");
            this.map.redrawMarkers();
            this.map.showHighlight.calledOnce.should.equal(true);
          });
        });
      });

      describe("showHighlight", function () {
        it("should clear any existing highlight", function () {
          var setMap = sinon.stub();
          this.map.paths = [{setMap: setMap}];
          this.map.showHighlight();
          this.map.paths.should.eql([]);
          setMap.calledWith(null).should.equal(true);
        });
        it("should create a path for each highlight", function () {
          this.map.model.set("importance", 9);
          this.map.model.set("highlight", {
            id: 1,
            points: [
              {lat: 10, lon: -20, start_date: "1900-01-01", importance_value: 10},
              {lat: 11, lon: -20, start_date: "1907-01-01", importance_value: 10}
            ]
          });
          this.map.paths = [];
          this.map.showHighlight();
          this.map.paths.length.should.equal(1);
        });
        it("should only create a path for highlights in the date range", function () {
          this.map.model.set("importance", 9);
          this.map.model.set("highlight", {
            id: 1,
            points: [
              {lat: 10, lon: -20, start_date: "1900-01-01", importance_value: 10},
              {lat: 11, lon: -20, start_date: "1907-01-01", importance_value: 10},
              {lat: 11, lon: -20, start_date: "1911-01-01", importance_value: 10},
              {lat: 12, lon: -20, start_date: "1920-01-01", importance_value: 10}
            ]
          });
          this.map.paths = [];

          this.map.model.set("date", [1900, 1920]);
          this.map.showHighlight();
          this.map.paths.length.should.equal(3);

          this.map.model.set("date", [1905, 1915]);
          this.map.showHighlight();
          this.map.paths.length.should.equal(1);
        });
        it("should only create a path for highlights with sufficient importance", function () {
          this.map.model.set("highlight", {
            id: 1,
            points: [
              {lat: 10, lon: -20, start_date: "1900-01-01", importance_value: 10},
              {lat: 11, lon: -20, start_date: "1907-01-01", importance_value: 11},
              {lat: 11, lon: -20, start_date: "1911-01-01", importance_value: 12},
              {lat: 12, lon: -20, start_date: "1920-01-01", importance_value: 13}
            ]
          });
          this.map.paths = [];

          this.map.model.set("date", [1900, 1921]);
          this.map.model.set("importance", 9);
          this.map.showHighlight();
          this.map.paths.length.should.equal(3);

          this.map.model.set("importance", 11);
          this.map.showHighlight();
          this.map.paths.length.should.equal(2);

          this.map.model.set("importance", 13);
          this.map.showHighlight();
          this.map.paths.length.should.equal(0);
        });
        it("should set the color for each path", function () {
          sinon.spy(this.map, "getColor");
          this.map.model.set("highlight", {
            id: 1,
            points: [
              {lat: 10, lon: -20, start_date: "1900-01-01", importance_value: 10},
              {lat: 12, lon: -20, start_date: "1910-01-01", importance_value: 10},
              {lat: 12, lon: -20, start_date: "1920-01-01", importance_value: 10}
            ]
          });
          this.map.paths = [];

          this.map.model.set("date", [1900, 1920]);
          this.map.showHighlight();
          this.map.getColor.calledTwice.should.equal(true);
        });

        it("should only highlight paths around the selected event at the start", function () {
          sinon.spy(this.map, "getColor");
          this.map.model.set("highlight", {
            id: 1,
            points: [
              {event_id: 1, lat: 10, lon: -20, start_date: "1900-01-01", importance_value: 10},
              {event_id: 2, lat: 12, lon: -20, start_date: "1910-01-01", importance_value: 10},
              {event_id: 3, lat: 14, lon: -20, start_date: "1920-01-01", importance_value: 10},
              {event_id: 4, lat: 16, lon: -20, start_date: "1930-01-01", importance_value: 10}
            ]
          });
          this.map.paths = [];

          this.map.model.set("date", [1900, 1940]);
          this.map.model.set("selectedEventId", 1);
          this.map.showHighlight();
          this.map.paths[0].isDimmed.should.equal(true);
          this.map.paths[1].isDimmed.should.equal(true);
          this.map.paths[2].isDimmed.should.equal(false);
        });

        it("should only highlight paths around the selected event in the middle", function () {
          sinon.spy(this.map, "getColor");
          this.map.model.set("highlight", {
            id: 1,
            points: [
              {event_id: 1, lat: 10, lon: -20, start_date: "1900-01-01", importance_value: 10},
              {event_id: 2, lat: 12, lon: -20, start_date: "1910-01-01", importance_value: 10},
              {event_id: 3, lat: 14, lon: -20, start_date: "1920-01-01", importance_value: 10},
              {event_id: 4, lat: 16, lon: -20, start_date: "1930-01-01", importance_value: 10}
            ]
          });
          this.map.paths = [];

          this.map.model.set("date", [1900, 1940]);
          this.map.model.set("selectedEventId", 2);
          this.map.showHighlight();
          this.map.paths[0].isDimmed.should.equal(true);
          this.map.paths[1].isDimmed.should.equal(false);
          this.map.paths[2].isDimmed.should.equal(false);
        });

        it("should only highlight paths around the selected event at the end", function () {
          sinon.spy(this.map, "getColor");
          this.map.model.set("highlight", {
            id: 1,
            points: [
              {event_id: 1, lat: 10, lon: -20, start_date: "1900-01-01", importance_value: 10},
              {event_id: 2, lat: 12, lon: -20, start_date: "1910-01-01", importance_value: 10},
              {event_id: 3, lat: 14, lon: -20, start_date: "1920-01-01", importance_value: 10},
              {event_id: 4, lat: 16, lon: -20, start_date: "1930-01-01", importance_value: 10}
            ]
          });
          this.map.paths = [];

          this.map.model.set("date", [1900, 1940]);
          this.map.model.set("selectedEventId", 4);
          this.map.showHighlight();
          this.map.paths[0].isDimmed.should.equal(true);
          this.map.paths[1].isDimmed.should.equal(true);
          this.map.paths[2].isDimmed.should.equal(false);
        });

        it("should show an infowindow for the selected event", function () {
          sinon.spy(this.map, "showSelectedPoint");
          this.map.model.set({
            "highlight": {
              id: 1,
              points: [
                {event_id: 102, lat: 10, lon: -20, start_date: "1900-01-01", importance_value: 10}
              ]
            },
            "date": [1900, 1940],
            selectedEventId: 102
          });
          this.map.paths = [];
          this.map.showHighlight();
          this.map.showSelectedPoint.calledOnce.should.equal(true);
        });
      });

      describe("forceUpdate", function () {
        it("should trigger a reset on the map", function () {
          this.mockMap();
          this.map.forceUpdate();
          google.maps.event.trigger.calledOnce.should.equal(true);
          google.maps.event.trigger.args[0][1].should.equal("resize");
        });
        it("should remember the center position", function () {
          this.mockMap();
          var centerValue = {};
          this.map.map.getCenter = function () {
            return centerValue;
          };
          this.map.forceUpdate();
          this.map.map.setCenter.calledWith(centerValue).should.equal(true);
        });
        it("should set the lastEvent to resize", function () {
          this.mockMap();
          this.map.forceUpdate();
          window.lastEvent.should.equal("resize");
        });
        it("should unset the lastEvent after some time if it is still resize", function () {
          this.mockMap();
          this.clock = sinon.useFakeTimers();
          try {
            this.map.forceUpdate();
            this.clock.tick(1200);
            window.lastEvent.should.equal("");
          } finally {
            this.clock.restore();
          }
        });
        it("should not unset the lastEvent after some time if it is not resize", function () {
          this.mockMap();

          this.clock = sinon.useFakeTimers();
          try {
            this.map.forceUpdate();
            window.lastEvent = "something else";
            this.clock.tick(1200);
            window.lastEvent.should.equal("something else");
          } finally {
            this.clock.restore();
          }
        });
      });
      describe("updateLocation", function () {

        beforeEach(function () {
          User.user = userLoggedInWithAddEventPermission;
          this.map = new Map({
            model: this.model,
            eventLocationsCollection: collection
          });

          this.mockMap({getCenter: sinon.stub()});

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
            this.map.model.set("highlight", {id: 1});
          });
          it("should redraw the markers", function () {
            this.map.updateLocation();
            this.map.redrawMarkers.calledOnce.should.equal(true);
          });
          it("should remember the last highlighted ids", function () {
            this.map.updateLocation();
            this.map.lastHighlight.should.eql({id: 1});
          });
        });
      });
      describe("when nothing needs redrawing", function () {
        beforeEach(function () {
            sinon.stub(this.map, "mapNeedsUpdating", function () {
              return false;
            });
            sinon.stub(this.map, "mapNeedsRedrawing", function () {
              return false;
            });
            sinon.stub(this.map, "redrawMarkers");
            this.map.model.set("highlight", {id: 1});
          });
        it("should remember the last position to which it was navigated", function () {
          this.map.lastModelPosition = null;
          this.map.updateLocation();
          this.map.lastModelPosition.should.eql(this.map.getModelPosition());
        });
      });
      describe("onBoundsChanged", function () {
        it("should set the last postion to 'map'", function () {
          this.mockMap();
          window.lastEvent = "x";
          this.map.onBoundsChanged();
          window.lastEvent.should.equal("map");
        });
        it("should not set the last postion to 'map' if locationChanged is true", function () {
          this.mockMap();
          this.map.locationChanged = true;
          window.lastEvent = "x";
          this.map.onBoundsChanged();
          window.lastEvent.should.not.equal("map");
        });
        it("should set the model from the map", function () {
          this.mockMap();
          sinon.stub(this.map.model, "set");
          this.map.onBoundsChanged();
          this.map.model.set.calledOnce.should.equal(true);
        });
        it("should not reposition the map", function () {
          this.map.getZoom = function () {
            return 8;
          };
          this.map.lastModelPosition = {
            date: [1900, 2000]
          };
          this.model.set("date", [1900, 2000]);
          this.mockMap();
          sinon.spy(this.map, "mapNeedsRedrawing");
          this.map.render();
          this.map.onBoundsChanged();
          this.map.mapNeedsRedrawing.calledOnce.should.equal(true);
          this.map.mapNeedsRedrawing.returned(false).should.equal(true);
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
          this.map.getBounds().should.eql([{lat: 10, lon: -20}, {lat: -30, lon: 40}]);
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
        it("needs redrawing when highlight have been set", function () {
          this.map.model.set("highlight", {id: 1});
          this.map.lastModelPosition = {
            date: [1900, 2000]
          };
          this.model.set("date", [1900, 2000]);
          this.map.lastHighlight = {};
          this.map.mapNeedsRedrawing().should.equal(true);
        });
        it("needs redrawing when highlight have been removed", function () {
          this.map.model.set("highlight", {});
          this.map.lastModelPosition = {
            date: [1900, 2000]
          };
          this.model.set("date", [1900, 2000]);
          this.map.lastHighlight = {id: 1};
          this.map.mapNeedsRedrawing().should.equal(true);
        });
        it("does not need redrawing when highlight are the same", function () {
          this.map.model.set("highlight", {id: 1});
          this.map.lastModelPosition = {
            date: [1900, 2000]
          };
          this.model.set("date", [1900, 2000]);
          this.map.lastHighlight = {id: 1};
          this.map.mapNeedsRedrawing().should.equal(false);
        });
        it("needs redrawing when the dates have changed", function () {
          this.map.model.set("highlight", {id: 1});
          this.map.lastModelPosition = {
            date: [1901, 2000]
          };
          this.model.set("date", [1900, 2000]);
          this.map.lastHighlight = {id: 1};
          this.map.mapNeedsRedrawing().should.equal(true);
        });
        it("needs redrawing when the importance has changed", function () {
          this.map.model.set("highlight", {id: 1});
          this.map.model.set("importance", {id: 11});
          this.map.lastModelPosition = {
            date: [1900, 2000]
          };
          this.model.set("date", [1900, 2000]);
          this.map.lastImportance = 10;
          this.map.lastHighlight = {id: 1};
          this.map.mapNeedsRedrawing().should.equal(true);
        });
        it("does not need redrawing when the importance has not changed", function () {
          this.map.model.set("highlight", {id: 1});
          this.map.model.set("importance", 11);
          this.map.lastModelPosition = {
            date: [1900, 2000]
          };
          this.model.set("date", [1900, 2000]);
          this.map.lastImportance = 11;
          this.map.lastHighlight = {id: 1};
          this.map.mapNeedsRedrawing().should.equal(false);
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
          this.model.set("highlight", {id: 1});
          this.map.isDimmed([{participants: [{thing_id: 2}]}]).should.equal(true);
        });
        it("should be dimmed when there are places to highlight, but not in this marker", function () {
          this.model.set("highlight", {id: 1});
          this.map.isDimmed([{participants: [], place_thing_id: 2}]).should.equal(true);
        });
        it("should not be dimmed when there are things to highlight that are in this marker", function () {
          this.model.set("highlight", {id: 1});
          this.map.isDimmed([{participants: [{thing_id: 1}]}]).should.equal(false);
        });
        it("should not be dimmed when there are multiple participants, one to highlight that are in this marker", function () {
          this.model.set("highlight", {id: 1});
          this.map.isDimmed([{participants: [{thing_id: 2}, {thing_id: 1}]}]).should.equal(false);
        });
        it("should not be dimmed when there are places to highlight that are in this marker", function () {
          this.model.set("highlight", {id: 1});
          this.map.isDimmed([{participants: [], place_thing_id: 1}]).should.equal(false);
        });
        it("should not be dimmed when there are no things to highlight", function () {
          this.model.set("highlight", {});
          this.map.isDimmed([{participants: [], place_thing_id: 1}]).should.equal(false);
        });
      });

      describe("info box", function () {
        it("should send summary information to analytics", function () {
          var data = this.map.getInfoWindowData({
            location: [1, 2],
            events: [{
              start_date: "1900-01-01T00:00:00.000Z",
              end_date: "1900-01-01T23:59:00.000Z",
              event_name: "x",
              place_thing_name: "some place"
            }, {
              start_date: "1950-01-01T00:00:00.000Z",
              end_date: "1950-01-01T23:59:00.000Z",
              event_name: "y",
              place_thing_name: "some place"
            }, {
              start_date: "1990-01-01T00:00:00.000Z",
              end_date: "1990-01-01T23:59:00.000Z",
              event_name: "z",
              place_thing_name: "some place"
            }]
          });
          data.eventNames.should.eql(["x", "y", "z"]);
          data.startDate.should.equal("1900-01-01T00:00:00.000Z");
          data.endDate.should.equal("1990-01-01T23:59:00.000Z");
        });
        describe("date range", function () {
          it("should show dates within a day of eachother as a single day", function () {
            this.map.getDateRangeString(
              {
                start_date: "2014-01-02 00:00",
                end_date: "2014-01-02 23:59",
                start_offset_seconds: 0,
                end_offset_seconds: 0
              }
            ).should.equal("02/01/2014");
          });
          it("should handle timezone offsets", function () {
            this.map.getDateRangeString(
              {
                start_date: "2014-01-02 23:00",
                end_date: "2014-01-02 22:59",
                start_offset_seconds: -3600,
                end_offset_seconds: -3600
              }
            ).should.equal("02/01/2014");
          });
          it("should not show leading zeros for days before 1000", function () {
            this.map.getDateRangeString(
              {
                start_date: {y: 314, M: 0, d: 1},
                end_date: {y: 314, M: 0, d: 1, h: 23, m: 59},
                start_offset_seconds: 0,
                end_offset_seconds: 0
              }
            ).should.equal("01/01/0314");
          });
          it("should show dates more than a day apart as a range", function () {
            this.map.getDateRangeString(
              {
                start_date: "2014-01-01 23:50",
                end_date: "2014-01-03 01:10",
                start_offset_seconds: 0,
                end_offset_seconds: 0
              }
            ).should.equal("01/01/2014 \u2013 03/01/2014");
          });
          it("should show BCE suffix when showing a single day before 0", function () {
            this.map.getDateRangeString(
              {
                start_date: {y: -314, M: 0, d: 1},
                end_date: {y: -314, M: 0, d: 1, h: 23, m: 59},
                start_offset_seconds: 0,
                end_offset_seconds: 0
              }
            ).should.equal("01/01/0314 BCE");
          });
          it("should show BCE suffix on the first day when showing a range spanning 0", function () {
            this.map.getDateRangeString(
              {
                start_date: {y: -314, M: 0, d: 1, h: 23, m: 50},
                end_date: {y: 314, M: 0, d: 2, h: 10, m: 10},
                start_offset_seconds: 0,
                end_offset_seconds: 0
              }
            ).should.equal("01/01/0314 BCE \u2013 02/01/0314 CE");
          });
          it("should show BCE suffix on the last day when showing a range before 0", function () {
            this.map.getDateRangeString(
              {
                start_date: {y: -314, M: 0, d: 1, h: 23, m: 50},
                end_date: {y: -314, M: 0, d: 3, h: 10, m: 10},
                start_offset_seconds: 0,
                end_offset_seconds: 0
              }
            ).should.equal("01/01/0314 \u2013 03/01/0314 BCE");
          });
        });
        describe("marker links", function () {
          beforeEach(function () {
            this.event = {
              participants: [{
                thing_id: 123,
                thing_name: "some thing",
                thing_link: "http://somewhere.com",
                importance_value: 50
              }],
              event_id: 1,
              creator_user_id: 101,
              event_last_edited: "2013-01-01",
              event_name: "some name",
              thing_name: "some thing",
              event_link: "http://something.com/blah",
              start_date: "2013-03-02",
              end_date: "2013-04-03",
              location: [[20, -53]],
              place_thing_name: "some place"
            };
          });
          describe("single participants", function () {
            it("should contain the event data in the dataset", function () {
              var text = this.map.getInfoWindowEntry(this.event);
              var el = $(text);
              var dataset = el.data();

              dataset.thingId.should.equal(this.event.participants[0].thing_id);
              dataset.name.should.equal(this.event.event_name);
              dataset.link.should.equal(this.event.event_link);
              dataset.lat.should.equal(this.event.location[0][0]);
              dataset.lon.should.equal(this.event.location[0][1]);
              dataset.startDate.should.equal(this.event.start_date);
              dataset.endDate.should.equal(this.event.end_date);
            });
            it("should be highlighted when the thing id matches the model's highlight", function () {
              this.map.model.set("highlight", {id: 123});
              var text = this.map.getInfoWindowEntry(this.event);
              $(text).find(".event-link").hasClass("highlight").should.equal(true);
            });
            it("should not be highlighted when the thing id does not match the model's highlight", function () {
              this.map.model.set("highlight", {id: 124});
              var text = this.map.getInfoWindowEntry(this.event);
              $(text).find(".event-link").hasClass("highlight").should.equal(false);
            });
          });

          describe("multiple participants", function () {
            beforeEach(function () {
              this.event.participants.push({
                thing_id: 1234,
                thing_name: "some thing",
                thing_link: "http://somewhere.com",
                importance_value: 100
              });
            });
            it("should contain the event data in the dataset", function () {
              var text = this.map.getInfoWindowEntry(this.event);
              var parent = $(text);

              parent.find(".participant").each(_.bind(function (i, el) {
                var dataset = $(el).data();
                dataset.thingId.should.equal(this.event.participants[i].thing_id);
                dataset.thingName.should.equal(this.event.participants[i].thing_name);
              }, this));

            });
            it("should be highlighted when the first thing id matches the model's highlight", function () {
              this.map.model.set("highlight", {id: 123});
              var text = this.map.getInfoWindowEntry(this.event);
              $(text).find(".event-link").hasClass("highlight").should.equal(true);
            });
            it("should be highlighted when the another thing id matches the model's highlight", function () {
              this.map.model.set("highlight", {id: 1234});
              var text = this.map.getInfoWindowEntry(this.event);
              $(text).find(".event-link").hasClass("highlight").should.equal(true);
            });
            it("should not be highlighted when the thing id does not match the model's highlight", function () {
              this.map.model.set("highlight", {id: 124});
              var text = this.map.getInfoWindowEntry(this.event);
              $(text).find(".event-link").hasClass("highlight").should.equal(false);
            });
          });
        });
      });


      describe("getColor", function () {
        it("should be blue at the most recent end", function () {
          var map = new Map({model: this.model});
          map.getColor(new Date("2000-12-31")).should.be.equal("#0000ff");
        });
        it("should be red at the most distant end", function () {
          var map = new Map({model: this.model});
          map.getColor(new Date("1900-01-01")).should.be.equal("#ff0000");
        });
        it("should be a mixture in the middle", function () {
          var map = new Map({model: this.model});
          map.getColor(new Date("1950-05-06")).should.be.equal("#7e0080");
        });
        it("should be washed out if it is dimmed", function () {
          var map = new Map({model: this.model});
          map.getColor(new Date("1900-01-01"), true).should.be.equal("#ff9f79");
        });
        it("should a mixture in the middle around 1CE", function () {
          this.model.set("date", [10, -10]);
          var map = new Map({model: this.model});
          map.getColor(new Date(-1, 0, 1)).should.be.equal("#72008c");
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
          User.user = userLoggedInWithAddEventPermission;
          var map = new Map({
            model: this.model
          });
          map.onClick();
          this.clock.tick(200);
          OptionsMenu.prototype.render.calledOnce.should.equal(true);
        });


        it("should not show the options menu when the user is logged in and without permission", function () {
          User.user = userLoggedIn;
          var map = new Map({
            model: this.model
          });
          map.onClick();
          this.clock.tick(200);
          OptionsMenu.prototype.render.calledOnce.should.equal(false);
        });

        it("should not show the options menu when the user is not logged in", function () {
          User.user = userLoggedOut;
          var map = new Map({
            model: this.model
          });
          map.onClick();
          this.clock.tick(200);
          OptionsMenu.prototype.render.calledOnce.should.equal(false);
        });

        it("should close open windows when it shows the options menu", function () {
          User.user = userLoggedInWithAddEventPermission;
          var map = new Map({model: this.model});
          map.closeOpenWindows = sinon.stub();
          map.onClick();
          this.clock.tick(200);
          map.closeOpenWindows.calledOnce.should.equal(true);
        });

        it("should not fire if it was double clicked", function () {
          User.user = userLoggedIn;
          var map = new Map({
            model: this.model
          });
          map.closeOpenWindows = sinon.stub();
          map.onClick();
          map.onDblClick();
          this.clock.tick(200);
          should.not.exist(map.lastOptionsMenu);
        });

        it("should close open windows if it was double clicked", function () {
          User.user = userLoggedIn;
          var map = new Map({
            model: this.model
          });
          map.closeOpenWindows = sinon.stub();
          map.onClick();
          map.onDblClick();
          this.clock.tick(200);
          map.closeOpenWindows.calledOnce.should.equal(true);
        });

      });

      describe("closeOpenWindows", function () {

        it("should close an open info boxes", function () {
          User.user = userLoggedIn;
          var map = new Map({
            model: this.model
          });
          var close = sinon.stub();
          map.openInfoWindows = [{close: close}];
          map.closeOpenWindows();
          close.calledOnce.should.equal(true);
        });

        it("should close an existing options menu", function () {
          User.user = userLoggedIn;
          var map = new Map({
            model: this.model
          });
          map.lastOptionsMenu = {close: sinon.stub()};
          map.closeOpenWindows();
          map.lastOptionsMenu.close.calledOnce.should.equal(true);
        });

      });
    });
  }

);
