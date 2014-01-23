/*global sinon, describe, it, beforeEach, afterEach */
define(

  ["underscore", "backbone", "jquery", "collections/event_locations",
   "utils/filter_url_serialiser"],

  function (_, Backbone, $, EventLocations, FilterUrlSerialiser) {
    beforeEach(function () {
      this.model = new Backbone.Model({
        center: [-10, 12],
        date: [1900, 2000],
        zoom: 3,
        bounds: [{lat: 10, lon: -20}, {lat: -20, lon: 34}],
        filterState: new Backbone.Collection()
      });
      FilterUrlSerialiser.deserialise("1:u;3:*;4:11", this.model);
      this.events = new EventLocations({
        state: this.model
      });
    });
    describe("request", function () {
      beforeEach(function () {
        sinon.stub($, "get");
      });
      afterEach(function () {
        $.get.restore();
      });
      it("should take the lat from the model's position", function () {
        this.events.updateData();
        $.get.args[0][1].lat.should.equal(-10);
      });
      it("should take the lon from the model's position", function () {
        this.events.updateData();
        $.get.args[0][1].lon.should.equal(12);
      });
      it("should pass the bounds as a nested array", function () {
        this.events.updateData();
        $.get.args[0][1].bounds.should.eql([[10, -20], [-20, 34]]);
      });
      it("should get the start of the year of the start", function () {
        this.events.updateData();
        $.get.args[0][1].start.should.equal("1900-01-01 00:00");
      });
      it("should get the end of the year of the end", function () {
        this.events.updateData();
        $.get.args[0][1].end.should.equal("2000-12-31 23:59");
      });
      it("should pass the type filters", function () {
        this.events.updateData();
        $.get.args[0][1].typeFilters.should.equal(JSON.stringify([{id: 3}]));
      });
      it("should pass the subtype filters", function () {
        this.events.updateData();
        $.get.args[0][1].subtypeFilters.should.equal(JSON.stringify([{
          id: 11,
          parent_type: 4
        }]));
      });
      it("should pass the notSpecifedType filters", function () {
        this.events.updateData();
        $.get.args[0][1].notSpecifiedTypeFilters.should.equal(JSON.stringify([{
          id: 1
        }]));
      });
    });
    describe("combineEventsAtTheSamePlace", function () {
      it("should combine two events at the same place to one entry", function () {
        var result = this.events.combineEventsAtTheSamePlace([{
          location: [[10, -20]],
          start_date: "1900-01-01 00:00"
        }, {
          location: [[10, -20]],
          start_date: "1900-01-01 00:00"
        }, {
          location: [[10, -21]],
          start_date: "1900-01-01 00:01"
        }]);
        result.should.eql(
          [
            [
              {
                location: [[10, -20]],
                start_date: "1900-01-01 00:00"
              }, {
                location: [[10, -20]],
                start_date: "1900-01-01 00:00"
              }
            ],
            [
              {
                location: [[10, -21]],
                start_date: "1900-01-01 00:01"
              }
            ]
          ]
        );
      });
      it("should sort the events within the location by the date of the start_time", function () {
        var result = this.events.combineEventsAtTheSamePlace([{
          location: [[10, -20]],
          start_date: "1900-01-03 00:02"
        }, {
          location: [[10, -20]],
          start_date: "1900-01-02 00:01"
        }, {
          location: [[10, -20]],
          start_date: "1900-01-01 00:00"
        }]);
        result.should.eql(
          [
            [
              {
                location: [[10, -20]],
                start_date: "1900-01-01 00:00"
              }, {
                location: [[10, -20]],
                start_date: "1900-01-02 00:01"
              }, {
                location: [[10, -20]],
                start_date: "1900-01-03 00:02"
              }
            ]
          ]
        );
      });
    });
    describe("makeKey", function () {
      it("should make keys of only the necessary properties", function () {
        var key = this.events.makeKey([
          {
            location: [[10, -20]],
            start_date: "1900-01-03 00:02",
            distance: 3
          }, {
            location: [[10, -20]],
            start_date: "1900-01-02 00:01",
            distance: 3
          }, {
            location: [[10, -20]],
            start_date: "1900-01-01 00:00",
            distance: 3
          }
        ]);
        _.pluck(JSON.parse(key).events, "start_date").should.not.eql([undefined, undefined, undefined]);
        _.pluck(JSON.parse(key).events, "distance").should.eql([undefined, undefined, undefined]);
      });
    });
    describe("handleResults", function () {
      beforeEach(function () {
        this.saveReset = function () {
          this.lastReset = arguments[0];
        };
        this.events.on("reset", this.saveReset, this);
      });
      afterEach(function () {
        this.events.off("reset", this.saveReset);
      });
      it("should notifiy the collection listeners that events are no longer in the set", function () {
        this.events.lastResults = [
          [
            {
              location: [[10, -20]],
              start_date: "1900-01-01T00:00:00.000Z"
            }, {
              location: [[10, -20]],
              start_date: "1900-01-01T00:01:00.000Z"
            }
          ],
          [
            {
              location: [[10, -21]],
              start_date: "1900-01-01T00:01:00.000Z"
            }
          ]
        ];

        this.events.handleResults([{
          location: [[10, -20]],
          start_date: "1900-01-01T00:00:00.000Z"
        }, {
          location: [[10, -20]],
          start_date: "1900-01-01T00:01:00.000Z"
        }, {
          location: [[10, -22]],
          start_date: "1900-01-01T00:01:00.000Z"
        }]);

        //todo: why this mismatching double arrays around location?
        this.lastReset[0].should.eql([JSON.stringify({
          location: [10, -21],
          events: [{
            location: [[10, -21]],
            start_date: "1900-01-01T00:01:00.000Z"
          }]
        })]);

      });
      it("should notifiy the collection listeners that new events are in the set", function () {
        this.events.lastResults = [
          [
            {
              location: [[10, -20]],
              start_date: "1900-01-01T00:00:00.000Z"
            }, {
              location: [[10, -20]],
              start_date: "1900-01-01T00:01:00.000Z"
            }
          ],
          [
            {
              location: [[10, -21]],
              start_date: "1900-01-01T00:01:00.000Z"
            }
          ]
        ];

        this.events.handleResults([{
          location: [[10, -20]],
          start_date: "1900-01-01T00:00:00.000Z"
        }, {
          location: [[10, -20]],
          start_date: "1900-01-01T00:01:00.000Z"
        }, {
          location: [[10, -22]],
          start_date: "1900-01-01T00:01:00.000Z"
        }]);

        //todo: why this mismatching double arrays around location?
        this.lastReset[1].should.eql([JSON.stringify({
          location: [10, -22],
          events: [{
            location: [[10, -22]],
            start_date: "1900-01-01T00:01:00.000Z"
          }]
        })]);
      });

      it("should not notifiy the collection listeners existing events have not changed", function () {
        this.events.lastResults = [
          [
            {
              location: [[10, -19]],
              start_date: "1900-01-01 00:00"
            }
          ],
          [
            {
              location: [[10, -20]],
              start_date: "1900-01-01 00:01"
            }
          ]
        ];

        this.events.handleResults([{
          location: [[10, -20]],
          start_date: "1900-01-01 00:01"
        }, {
          location: [[10, -22]],
          start_date: "1900-01-01 00:01"
        }]);

        this.lastReset[0].length.should.equal(1);
        this.lastReset[1].length.should.equal(1);

        JSON.parse(this.lastReset[0][0]).location[1].should.not.equal(-20);
        JSON.parse(this.lastReset[1][0]).location[1].should.not.equal(-20);
      });
    });
  }
);