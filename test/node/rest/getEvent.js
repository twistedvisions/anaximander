/*global describe, it, beforeEach */
var getEvent = require("../../../lib/rest/getEvent");
var should = require("should");
var _ = require("underscore");
describe("getEvent", function () {

  describe("handleGetEvent", function () {
    beforeEach(function () {
      this.event = null;
      this.req = {
        send: _.bind(function (_event) {
          this.event = _event;
        }, this)
      };
      this.firstRow = {
        importance_id: 20,
        type_id: 21,
        place_id: 22,
        place_name: "Paris"
      };
      this.next = function () {};
    });
    it("should make an importance object", function () {
      getEvent.handleGetEvent(this.req, this.next, {rows: [this.firstRow]});
      this.event.importance.id.should.equal(20);
    });
    it("should remove the importance id", function () {
      getEvent.handleGetEvent(this.req, this.next, {rows: [this.firstRow]});
      should.not.exist(this.event.importance_id);
    });
    it("should make an type object", function () {
      getEvent.handleGetEvent(this.req, this.next, {rows: [this.firstRow]});
      this.event.type.id.should.equal(21);
    });
    it("should remove the type id", function () {
      getEvent.handleGetEvent(this.req, this.next, {rows: [this.firstRow]});
      should.not.exist(this.event.type_id);
    });
    it("should make an place object", function () {
      getEvent.handleGetEvent(this.req, this.next, {rows: [this.firstRow]});
      this.event.place.id.should.equal(22);
      this.event.place.name.should.equal("Paris");
    });
    it("should remove the place id", function () {
      getEvent.handleGetEvent(this.req, this.next, {rows: [this.firstRow]});
      should.not.exist(this.event.place_id);
    });
    it("should remove the place name", function () {
      getEvent.handleGetEvent(this.req, this.next, {rows: [this.firstRow]});
      should.not.exist(this.event.place_name);
    });
    it("should group results into participants", function () {
      getEvent.handleGetEvent(this.req, this.next, {rows: [{}, {}]});
      this.event.participants.length.should.equal(2);
    });
    it("should group keys prefixed with participant", function () {
      getEvent.handleGetEvent(this.req, this.next, {rows:
        [{
          participant_id: 1,
          participant_type_id: 10,
          participant_importance_id: 100
        },
        {
          participant_id: 2,
          participant_type_id: 20,
          participant_importance_id: 200
        }]
      });
      this.event.participants[0].thing.id.should.equal(1);
      this.event.participants[0].type.id.should.equal(10);
      this.event.participants[0].importance.id.should.equal(100);

      this.event.participants[1].thing.id.should.equal(2);
      this.event.participants[1].type.id.should.equal(20);
      this.event.participants[1].importance.id.should.equal(200);
    });
  });
});