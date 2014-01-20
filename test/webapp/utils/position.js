/*global describe, it */
define(

  ["utils/position"],

  function (Position) {
    describe("position", function () {
      describe("normalisePosition", function () {
        it("should return the position exactly when 0 >= x > 180", function () {
          Position.normalisePosition(90).should.equal(90);
        });
        it("should return the position exactly when -180 > x >= 0", function () {
          Position.normalisePosition(-90).should.equal(-90);
        });
        it("should normalise the postition when x < -180", function () {
          Position.normalisePosition(-270).should.equal(90);
        });
        it("should normalise the postition when x > 180", function () {
          Position.normalisePosition(270).should.equal(-90);
        });
      });
      describe("getCenter", function () {
        it("should calculate the midpoint if the bounding box is not a point", function () {
          Position.getCenter(10, -20, -30, 40).should.eql(
            [-10, 10]
          );
        });
        it("should get the midpoint closest to each point", function () {
          Position.getCenter(10, -100, -30, 120).should.eql(
            [-10, -170]
          );
        });
      });
    });
  }
);