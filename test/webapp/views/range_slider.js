/*global describe, it, beforeEach */
define(

  ["chai", "backbone", "views/range_slider"],

  function (chai, Backbone, RangeSlider) {
    var should = chai.should();
    describe("range slider", function () {
      describe("initializing state", function () {
        it("should set the left state if passed", function () {
          this.slider = new RangeSlider({min: 0.25});
          this.slider.state.left.should.equal(0.25);
        });
        it("should set the right state if passed", function () {
          this.slider = new RangeSlider({max: 0.75});
          this.slider.state.right.should.equal(0.75);
        });
        it("should ensure the left is less than the right", function () {
          var e;
          try {
            this.slider = new RangeSlider({
              min: 0.5,
              max: 0.2
            });
          } catch (ex) {
            e = ex;
          }
          should.exist(e);
        });
        it("should default the left state to 0", function () {
          this.slider = new RangeSlider({});
          this.slider.state.left.should.equal(0);
        });
        it("should default the right state to 1", function () {
          this.slider = new RangeSlider({});
          this.slider.state.right.should.equal(1);
        });
        it("should ensure the left state cannot be less than 0", function () {
          this.slider = new RangeSlider({min: -0.25});
          this.slider.state.left.should.equal(0);
        });
        it("should ensure the right state cannot be more than 1", function () {
          this.slider = new RangeSlider({firstSliderPosition: 1.25});
          this.slider.state.right.should.equal(1);
        });
      });
      describe("getComponentDimensions", function () {
        it("should get the width of the grove", function () {
          this.slider = new RangeSlider();
          this.slider.render();
          this.slider.$(".groove").width(200);
          this.slider.getComponentDimensions();
          this.slider.dimensions.groove.width.should.equal(200);
        });
        it("should get the width of the first slider", function () {
          this.slider = new RangeSlider();
          this.slider.render();
          this.slider.$(".slider-a").width(20);
          this.slider.getComponentDimensions();
          this.slider.dimensions.sliderA.width.should.equal(20);
        });
        it("should get the width of the second slider", function () {
          this.slider = new RangeSlider();
          this.slider.render();
          this.slider.$(".slider-b").width(20);
          this.slider.getComponentDimensions();
          this.slider.dimensions.sliderB.width.should.equal(20);
        });
      });
      describe("dragging", function () {
        beforeEach(function () {
          this.slider = new RangeSlider({});
          this.slider.render();
          this.slider.$(".groove").width(200);
          this.slider.$(".slider-a").width(20);
          this.slider.$(".slider-b").width(20);
          this.slider.$(".slider-b").css("left", 160);
          this.slider.getComponentDimensions();
        });
        it("should update listeners", function () {
          var val;
          this.slider.on("update", function (v) {
            val = v;
          });
          this.slider.onDrag({target: {className: "slider-a"}});
          val.should.eql({min: 0, max: 1});
        });
        describe("normal extremes", function () {
          it("should set the state of the left slider at the far left", function () {
            this.slider.$(".slider-a").css("left", 0);
            this.slider.onDrag({target: {className: "slider-a"}});
            this.slider.getState().min.should.equal(0);
          });
          it("should set the state of the right slider at the far right", function () {
            this.slider.$(".slider-b").css("left", 160);
            this.slider.onDrag({target: {className: "slider-b"}});
            this.slider.getState().max.should.equal(1);
          });
        });
        describe("other extremes", function () {
          it("should set the state of the left slider at the far right", function () {
            this.slider.$(".slider-a").css("left", 160);
            this.slider.onDrag({target: {className: "slider-a"}});
            this.slider.getState().min.should.equal(1);
          });
          it("should set the state of the right slider at the far left", function () {
            this.slider.$(".slider-b").css("left", 0);
            this.slider.onDrag({target: {className: "slider-b"}});
            this.slider.getState().max.should.equal(0);
          });
        });
        describe("crossed over", function () {
          it("should set the state of the left slider when the right slider has fully been dragged over it", function () {
            this.slider.$(".slider-a").css("left", 80);
            this.slider.$(".slider-b").css("left", 40);
            this.slider.onDrag({target: {className: "slider-a"}});
            this.slider.getState().min.should.equal(0.25);
            this.slider.getState().max.should.equal(0.5);
          });
          it("should set the state of the right slider when the left slider has fully been dragged over it", function () {
            this.slider.$(".slider-a").css("left", 120);
            this.slider.$(".slider-b").css("left", 80);
            this.slider.onDrag({target: {className: "slider-b"}});
            this.slider.getState().min.should.equal(0.5);
            this.slider.getState().max.should.equal(0.75);
          });
          it("should set the state of the right slider when the left slider has just been dragged over it", function () {
            this.slider.$(".slider-a").css("left", 81);
            this.slider.$(".slider-b").css("left", 80);
            this.slider.onDrag({target: {className: "slider-a"}});
            this.slider.getState().min.should.equal(0.5);
            this.slider.getState().max.should.equal(0.5);
          });
          it("should set the state of the left slider when the right slider has just been dragged over it", function () {
            this.slider.$(".slider-a").css("left", 80);
            this.slider.$(".slider-b").css("left", 79);
            this.slider.onDrag({target: {className: "slider-b"}});
            this.slider.getState().min.should.equal(0.5);
            this.slider.getState().max.should.equal(0.5);
          });
        });
      });
      describe("dragging stopped", function () {
        beforeEach(function () {
          this.slider = new RangeSlider({});
          this.slider.render();
          this.slider.$(".groove").width(200);
          this.slider.$(".slider-a").width(20);
          this.slider.$(".slider-b").width(20);
          this.slider.$(".slider-b").css("left", 160);
          this.slider.getComponentDimensions();
        });
        it("should switch sliders back over if they were crossed", function () {
          this.slider.$(".slider-a").css("left", 120);
          this.slider.$(".slider-b").css("left", 80);
          this.slider.onDrag({target: {className: "slider-b"}});
          this.slider.onStop();
          parseInt(this.slider.$(".slider-a").css("left"), 10).should.equal(80);
          parseInt(this.slider.$(".slider-b").css("left"), 10).should.equal(120);
        });
        it("should update listeners", function () {
          var val;
          this.slider.onDrag({target: {className: "slider-b"}});
          this.slider.on("update", function (v) {
            val = v;
          });
          this.slider.onStop();
          val.should.eql({min: 0, max: 1});
        });
      });
      describe("redraw", function () {
        var right = function (el) {
          //the width of the first slider is added, because they both float
          return parseInt(el.css("left"), 10) + parseInt(el.css("width"), 10) + 20;
        };
        beforeEach(function () {
          this.slider = new RangeSlider();
          this.slider.render();
          this.slider.$(".groove").width(200);
          this.slider.$(".slider-a").width(20);
          this.slider.$(".slider-b").width(20);
          this.slider.getComponentDimensions();
        });
        describe("no slider selected", function () {
          describe("default position", function () {
            it("should put the left hand side of slider-a at the left side of the groove", function () {
              this.slider.redraw();
              parseInt(this.slider.$(".slider-a").css("left"), 10).should.equal(0);
            });
            it("should put the right hand side of slider-b at the right side of the groove", function () {
              this.slider.redraw();
              right(this.slider.$(".slider-b")).should.equal(200);
            });
          });
          describe("both at ends", function () {
            it("should have two sliders next to each other when both are at 0", function () {
              this.slider.setState(0, 0);
              this.slider.redraw();
              parseInt(this.slider.$(".slider-a").css("left"), 10).should.equal(0);
              right(this.slider.$(".slider-b")).should.equal(40);
            });
            it("should have two sliders next to each other when both are at 1", function () {
              this.slider.setState(1, 1);
              this.slider.redraw();
              parseInt(this.slider.$(".slider-a").css("left"), 10).should.equal(160);
              right(this.slider.$(".slider-b")).should.equal(200);
            });
          });
          describe("both at middle", function () {
            it("should have two sliders next to each other", function () {
              this.slider.setState(0.5, 0.5);
              this.slider.redraw();
              parseInt(this.slider.$(".slider-a").css("left"), 10).should.equal(80);
              right(this.slider.$(".slider-b")).should.equal(120);
            });
          });
        });
        describe("slider selected", function () {
          it("should flip the location of unselected slider-a", function () {
            this.slider.selectSliderB();
            this.slider.setState(0.5, 0.25);
            this.slider.redraw();
            right(this.slider.$(".slider-a")).should.equal(140);
            //other slider is being dragged so don't set it
          });
          it("should flip the location of unselected slider-b", function () {
            this.slider.selectSliderA();
            this.slider.setState(0.75, 0.5);
            this.slider.redraw();
            parseInt(this.slider.$(".slider-b").css("left"), 10).should.equal(60);
            //other slider is being dragged so don't set it
          });
        });
      });
    });
  }

);
