/*global describe, it, beforeEach */
var getEvent = require("../../../../lib/rest/util/GetEvent");
var should = require("should");

describe("GetEvent", function () {

  describe("handleGetEvent", function () {
    beforeEach(function () {
      this.firstRow = {
        end_date: new Date(),
        start_date: new Date(),
        importance_id: 20,
        type_id: 21,
        place_id: 22,
        place_name: "Paris"
      };
      this.next = function () {};
    });
    it("should convert postgres BCE year to JS BCE year for start dates", function () {
      //postgres year -1 === JS year 0
      this.firstRow.start_date = new Date(Date.UTC(-100, 0, 1));
      var event = getEvent.handleGetEvent([this.firstRow]);
      event.start_date.should.eql(new Date(Date.UTC(-99, 0, 1)));
    });
    it("should convert postgres BCE year to JS BCE year for end dates", function () {
      //postgres year -1 === JS year 0
      this.firstRow.end_date = new Date(Date.UTC(-100, 0, 1));
      var event = getEvent.handleGetEvent([this.firstRow]);
      event.end_date.should.eql(new Date(Date.UTC(-99, 0, 1)));
    });
    it("should make an importance object", function () {
      var event = getEvent.handleGetEvent([this.firstRow]);
      event.importance.id.should.equal(20);
    });
    it("should remove the importance id", function () {
      var event = getEvent.handleGetEvent([this.firstRow]);
      should.not.exist(event.importance_id);
    });
    it("should make an type object", function () {
      var event = getEvent.handleGetEvent([this.firstRow]);
      event.type.id.should.equal(21);
    });
    it("should remove the type id", function () {
      var event = getEvent.handleGetEvent([this.firstRow]);
      should.not.exist(event.type_id);
    });
    it("should make an place object", function () {
      var event = getEvent.handleGetEvent([this.firstRow]);
      event.place.id.should.equal(22);
      event.place.name.should.equal("Paris");
    });
    it("should remove the place id", function () {
      var event = getEvent.handleGetEvent([this.firstRow]);
      should.not.exist(event.place_id);
    });
    it("should remove the place name", function () {
      var event = getEvent.handleGetEvent([this.firstRow]);
      should.not.exist(event.place_name);
    });
    it("should group results into participants", function () {
      var event = getEvent.handleGetEvent([this.firstRow, this.firstRow]);
      event.participants.length.should.equal(2);
    });
    it("should group keys prefixed with participant", function () {
      var event = getEvent.handleGetEvent([
        {
          start_date: new Date(),
          end_date: new Date(),
          participant_id: 1,
          participant_type_id: 10,
          participant_importance_id: 100
        },
        {
          start_date: new Date(),
          end_date: new Date(),
          participant_id: 2,
          participant_type_id: 20,
          participant_importance_id: 200
        }
      ]);
      event.participants[0].thing.id.should.equal(1);
      event.participants[0].type.id.should.equal(10);
      event.participants[0].importance.id.should.equal(100);

      event.participants[1].thing.id.should.equal(2);
      event.participants[1].type.id.should.equal(20);
      event.participants[1].importance.id.should.equal(200);
    });
  });
});