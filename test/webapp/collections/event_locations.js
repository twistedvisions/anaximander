/*global describe, beforeEach, it */
define(

  ["backbone", "collections/event_locations"],

  function (Backbone, EventLocations) {
    describe("request", function () {
      it("should take the lat from the model's position");
      it("should take the long from the model's position");
      it("should pass the bounds as a nested array");
      it("should get the start of the year of the start_date");

      it("should get the end of the year of the end_date");
      it("should pass the type filters");
      it("should pass the subtype filters");
      it("should pass the notSpecifedType filters");
    });
    describe("combineEventsAtTheSamePlace", function () {
      it("should combine two events at the same place to one entry");
      it("should sort the events within the location by the date of the start_time");
    });
    describe("makeKey", function () {
      it("should make keys of only the necessary properties");
    });
    describe("handleResults", function () {
      it("should notifiy the collection listeners that events are no longer in the set");
      it("should notifiy the collection listeners that new events are in the set");
      it("should not notifiy the collection listeners existing events have not changed");
    });
    describe("formatYearAsTimestamp", function () {
      it("should pad the year so it is 4 digits when the year is < 100AD");
      it("should pad the year so it is 4 digits when the year is < 1000AD");
      it("should format the year appropriately when it is BC");
    });
  }
);