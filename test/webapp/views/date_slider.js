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

  }

);
