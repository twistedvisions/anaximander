/*global sinon, describe, it */
define(

  ["backbone", "views/date_slider"],

  function (Backbone, DateSlider) {

    var model = new Backbone.Model({
      center: [1, 1],
      date: [1900, 2000],
      zoom: 3
    });

    describe("interaction", function () {

      it("should set lastEvent to 'slider'", function () {
        var dateSlider = new DateSlider({model: model});

        dateSlider.$el.slider = sinon.stub();
        dateSlider.getTimeRange = function () {
          return [0, 1];
        };
        dateSlider.update = sinon.stub();

        // dateSlider.render();
        dateSlider.sliderChanged({min: 0, max: 1});
        window.lastEvent.should.equal("date-slider");
      });

    });

    describe("text", function () {
      it("should show no suffix if both times are after 1 BCE", function () {
        new DateSlider({model: model}).toText(1500, 1600).should.equal("1500");
      });
      it("should show suffix if it is CE and the other is BCE", function () {
        new DateSlider({model: model}).toText(1500, -1600).should.equal("1500CE");
      });
      it("should show no suffix if it is CE and the other is doesn't exist", function () {
        new DateSlider({model: model}).toText(1500).should.equal("1500");
      });
      it("should show suffix if it is BCE and the other is CE", function () {
        new DateSlider({model: model}).toText(-1500, 1600).should.equal("1501BCE");
      });
      it("should show suffix if it is BCE and the other is BCE", function () {
        new DateSlider({model: model}).toText(-1500, -1600).should.equal("1501BCE");
      });
      it("should show suffix if it is BCE and the other doesn't exist", function () {
        new DateSlider({model: model}).toText(-1500).should.equal("1501BCE");
      });
      it("should show suffix if it is 1 BCE and the other is 1 CE", function () {
        new DateSlider({model: model}).toText(0, 1).should.equal("1BCE");
      });
      it("should show suffix if it is 2 BCE and the other is 1 BCE", function () {
        new DateSlider({model: model}).toText(-1, 0).should.equal("2BCE");
      });
      it("should show no suffix if it is 1 CE and the other is 2 CE", function () {
        new DateSlider({model: model}).toText(1, 2).should.equal("1");
      });
    });

  }

);
