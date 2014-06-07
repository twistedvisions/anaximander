/*global describe, it */
define(

  ["utils/highlight"],

  function (Highlight) {
    describe("highlight", function () {
      describe("bounds", function () {
        it("should set the zoom to be -1 if the bounding box is not a point", function () {
          Highlight.determineModelBounds([
            {lat: 10, lon: -20},
            {lat: 11, lon: -21}
          ]).zoom.should.equal(-1);
        });
        it("should create a bounds that is 10% greater than the bounding box", function () {
          Highlight.extractBound([{}, {}], "lat", 10, 20).should.eql(
            [{lat: 9}, {lat: 21}]
          );
        });
      });
    });
  }
);