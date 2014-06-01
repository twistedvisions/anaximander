/*global describe, it, beforeEach */
define(

  ["chai", "backbone", "views/range_slider"],

  function (chai, Backbone, RangeSlider) {
    var should = chai.should();
    describe("range slider", function () {
      describe("initializing state", function () {
        it("should set the min state if passed", function () {
          this.slider = new RangeSlider({min: -100, max: 200, state: {min: 10}});
          this.slider.getState().min.should.equal(10);
        });
        it("should set the max state if passed", function () {
          this.slider = new RangeSlider({min: -100, max: 200, state: {max: 20}});
          this.slider.getState().max.should.equal(20);
        });
        it("should ensure the min state is less than the max", function () {
          var e;
          try {
            this.slider = new RangeSlider({
              min: -100,
              max: 200,
              state: {
                min: 20,
                max: 10
              }
            });
          } catch (ex) {
            e = ex;
          }
          should.exist(e);
        });
        it("should default the min state to the min range", function () {
          this.slider = new RangeSlider({min: -100, max: 200});
          this.slider.getState().min.should.equal(-100);
        });
        it("should default the max state to the max range", function () {
          this.slider = new RangeSlider({min: -100, max: 200});
          this.slider.getState().max.should.equal(200);
        });
        it("should ensure the min state cannot be less than the min range", function () {
          this.slider = new RangeSlider({min: -100, max: 200, state: {min: -200}});
          this.slider.getState().min.should.equal(-100);
        });
        it("should ensure the max state cannot be more than the max range", function () {
          this.slider = new RangeSlider({min: -100, max: 200, state: {max: 300}});
          this.slider.getState().max.should.equal(200);
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
          val.should.eql({min: 0, max: 100});
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
            this.slider.getState().max.should.equal(100);
          });
        });
        describe("other extremes", function () {
          it("should set the state of the left slider at the far right", function () {
            this.slider.$(".slider-a").css("left", 160);
            this.slider.onDrag({target: {className: "slider-a"}});
            this.slider.getState().min.should.equal(100);
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
            this.slider.getState().min.should.equal(25);
            this.slider.getState().max.should.equal(50);
          });
          it("should set the state of the right slider when the left slider has fully been dragged over it", function () {
            this.slider.$(".slider-a").css("left", 120);
            this.slider.$(".slider-b").css("left", 80);
            this.slider.onDrag({target: {className: "slider-b"}});
            this.slider.getState().min.should.equal(50);
            this.slider.getState().max.should.equal(75);
          });
          it("should set the state of the right slider when the left slider has just been dragged over it", function () {
            this.slider.$(".slider-a").css("left", 81);
            this.slider.$(".slider-b").css("left", 80);
            this.slider.onDrag({target: {className: "slider-a"}});
            this.slider.getState().min.should.equal(50);
            this.slider.getState().max.should.equal(50);
          });
          it("should set the state of the left slider when the right slider has just been dragged over it", function () {
            this.slider.$(".slider-a").css("left", 80);
            this.slider.$(".slider-b").css("left", 79);
            this.slider.onDrag({target: {className: "slider-b"}});
            this.slider.getState().min.should.equal(50);
            this.slider.getState().max.should.equal(50);
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
          val.should.eql({min: 0, max: 100});
        });
      });
      describe.only("stepping", function () {
        beforeEach(function () {
          this.slider = new RangeSlider({state: {min: 20, max: 80}});
          this.slider.render();
          this.slider.$(".groove").width(200);
          this.slider.$(".slider-a").width(20);
          this.slider.$(".slider-b").width(20);
          this.slider.getComponentDimensions();
          this.slider.redraw();
        });
        it("should step the left slider to the left by one", function () {
          this.slider.onStep({target: this.slider.$(".slider-a .left")[0]});
          this.slider.getState().min.should.equal(19);
          this.slider.getState().max.should.equal(80);
        });
        it("should step the left slider to the right by one", function () {
          this.slider.onStep({target: this.slider.$(".slider-a .right")[0]});
          this.slider.getState().min.should.equal(21);
          this.slider.getState().max.should.equal(80);
        });
        it("should step the right slider to the left by one", function () {
          this.slider.onStep({target: this.slider.$(".slider-b .left")[0]});
          this.slider.getState().min.should.equal(20);
          this.slider.getState().max.should.equal(79);
        });
        it("should step the right slider to the right by one", function () {
          this.slider.onStep({target: this.slider.$(".slider-b .right")[0]});
          this.slider.getState().min.should.equal(20);
          this.slider.getState().max.should.equal(81);
        });
        it("should not step the left slider to the right when it abuts the right slider", function () {
          this.slider.setState(50, 50);
          this.slider.onStep({target: this.slider.$(".slider-a .right")[0]});
          this.slider.getState().min.should.equal(50);
          this.slider.getState().max.should.equal(50);
        });
        it("should not step the right slider to the left when it abuts the left slider", function () {
          this.slider.setState(50, 50);
          this.slider.onStep({target: this.slider.$(".slider-b .left")[0]});
          this.slider.getState().min.should.equal(50);
          this.slider.getState().max.should.equal(50);
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
              this.slider.setState(100, 100);
              this.slider.redraw();
              parseInt(this.slider.$(".slider-a").css("left"), 10).should.equal(160);
              right(this.slider.$(".slider-b")).should.equal(200);
            });
          });
          describe("both at middle", function () {
            it("should have two sliders next to each other", function () {
              this.slider.setState(50, 50);
              this.slider.redraw();
              parseInt(this.slider.$(".slider-a").css("left"), 10).should.equal(80);
              right(this.slider.$(".slider-b")).should.equal(120);
            });
          });
        });
        describe("slider selected", function () {
          it("should flip the location of unselected slider-a", function () {
            this.slider.selectSliderB();
            this.slider.setState(50, 25);
            this.slider.redraw();
            right(this.slider.$(".slider-a")).should.equal(140);
            //other slider is being dragged so don't set it
          });
          it("should flip the location of unselected slider-b", function () {
            this.slider.selectSliderA();
            this.slider.setState(75, 50);
            this.slider.redraw();
            parseInt(this.slider.$(".slider-b").css("left"), 10).should.equal(60);
            //other slider is being dragged so don't set it
          });
        });
      });
    });
  }

);
