define([
  "jquery",
  "underscore",
  "backbone",
  "text!templates/range_slider.htm",
  "jqueryui",
  "less!../../css/range_slider"
], function ($, _, Backbone, template) {

  var RangeSliderView = Backbone.View.extend({
    initialize: function (opts) {
      opts = opts || {};
      this.min = opts.min !== undefined ? opts.min : 0;
      this.max = opts.max !== undefined ? opts.max : 100;
      this.initializeState(opts.state || {});
    },

    initializeState: function (state) {
      this.state = {
        selected: null
      };
      this.setState(
        state.min !== undefined ? state.min : this.min,
        state.max !== undefined ? state.max : this.max
      );
    },

    setState: function (left, right) {
      if ((left > right) && (!this.state.selected)) {
        throw new Error("the first value must be less than the second");
      }
      this.state.left = Math.max(this.min, left);
      this.state.right = Math.min(this.max, right);
    },

    render: function () {
      this.renderTemplate();
      this.getComponentDimensions();
      this.redraw();
      this.attachListeners();
    },

    renderTemplate: function () {
      this.$el.html(template);
    },

    getComponentDimensions: function () {
      this.dimensions = {
        groove: {
          width: this.$(".groove").width()
        },
        sliderA: {
          width: this.$(".slider-a").width()
        },
        sliderB: {
          width: this.$(".slider-b").width()
        }
      };
    },

    attachListeners: function () {
      this.$(".slider .step").on("click", _.bind(this.onStep, this));
      this.$(".slider").draggable({
        axis: "x",
        containment: "parent",
        drag: _.bind(this.onDrag, this),
        stop: _.bind(this.onStop, this)
      });
      $(window).resize(_.bind(function () {
        this.getComponentDimensions();
        this.redraw();
      }, this));
    },

    onStep: function (event) {
      var target = $(event.target);
      var change = target.hasClass("left") ? -1 : 1;
      var state = this.getState();

      if (target.parent().hasClass("slider-a")) {
        if (state.min + change <= state.max) {
          state.min += change;
        }
      } else {
        if (state.max + change >= state.min) {
          state.max += change;
        }
      }

      this.setState(state.min, state.max);
      this.redraw();
      this.updateListeners();
    },

    onDrag: function (event) {
      var combinedSliderWidth = this.dimensions.sliderA.width + this.dimensions.sliderB.width;
      var grooveWidth = this.dimensions.groove.width - combinedSliderWidth;

      var leftPos = parseInt(this.$(".slider-a").css("left"), 10);
      var rightPos = parseInt(this.$(".slider-b").css("left"), 10);

      var selectedSlider = this.getSelectedSlider(event);

      if (selectedSlider === "a") {
        this.selectSliderA();
      } else {
        this.selectSliderB();
      }

      var left, right;

      var selectedWidth = this.state.selected === "a" ?
        this.dimensions.sliderA.width :
        this.dimensions.sliderB.width;

      if (leftPos > rightPos + selectedWidth) {
        this.state.state = "crossed";
        //crossed over
        if (this.state.rightAdjusted) {
          left = (leftPos - this.dimensions.sliderB.width) / grooveWidth;
          right = (rightPos + this.dimensions.sliderB.width) / grooveWidth;
        } else if (this.state.leftAdjusted) {
          left = (leftPos - this.dimensions.sliderA.width) / grooveWidth;
          right = (rightPos + this.dimensions.sliderA.width) / grooveWidth;
        } else {
          right = rightPos / grooveWidth;
          left = leftPos / grooveWidth;
        }
      } else if (leftPos > rightPos) {
        this.state.state = "crossing";
        //crossing over
        if (selectedSlider === "a") {
          right = rightPos / grooveWidth;
          left = rightPos / grooveWidth;
        } else {
          right = leftPos / grooveWidth;
          left = leftPos / grooveWidth;
        }
      } else {
        this.state.state = "normal";
        //normal
        left = leftPos / grooveWidth;
        right = rightPos / grooveWidth;
      }

      var range = this.max - this.min;
      this.setState(
        Math.round(left * range + this.min),
        Math.round(right * range + this.min)
      );

      this.redraw();
      this.updateListeners();
    },

    getSelectedSlider: function (event) {
      return event.target.className.indexOf("slider-a") !== -1 ? "a" : "b";
    },

    onStop: function () {
      this.unselectSlider();
      this.state.leftAdjusted = false;
      this.state.rightAdjusted = false;
      if (this.state.left > this.state.right) {
        var left = this.state.left;
        this.state.left = this.state.right;
        this.state.right = left;
      }
      this.redraw();
      setTimeout(_.bind(this.redraw, this), 100);
      this.updateListeners();
    },

    selectSliderA: function () {
      this.$(".slider-a").addClass("selected");
      this.state.selected = "a";
    },

    selectSliderB: function () {
      this.$(".slider-b").addClass("selected");
      this.state.selected = "b";
    },

    unselectSlider: function () {
      this.$(".slider-" + this.state.selected).removeClass("selected");
      this.state.selected = null;
    },

    redraw: function () {
      //todo: cache in getComponentDimensions
      var combinedSliderWidth = this.dimensions.sliderA.width + this.dimensions.sliderB.width;
      var grooveWidth = this.dimensions.groove.width - combinedSliderWidth;

      var range = this.max - this.min;

      var sliderA_pos = Math.round((this.state.left - this.min) * grooveWidth / range);
      var sliderB_pos = Math.round((this.state.right - this.min) * grooveWidth / range);

      this.state.leftAdjusted = false;
      this.state.rightAdjusted = false;

      if ((this.state.selected === null) || (sliderA_pos <= sliderB_pos)) {
        this.$(".slider-a").css("left", sliderA_pos);
        this.$(".slider-b").css("left", sliderB_pos);
      } else if (this.state.selected === "a") {
        this.state.rightAdjusted = true;
        this.$(".slider-b").css("left", sliderB_pos - this.dimensions.sliderB.width);
      } else if (this.state.selected === "b") {
        this.state.leftAdjusted = true;
        this.$(".slider-a").css("left", sliderA_pos + this.dimensions.sliderA.width);
      }
    },

    updateListeners: function () {
      this.trigger("update", this.getState());
    },

    getState: function () {
      return {
        min: Math.min(this.state.left, this.state.right),
        max: Math.max(this.state.left, this.state.right)
      };
    }
  });

  return RangeSliderView;
});