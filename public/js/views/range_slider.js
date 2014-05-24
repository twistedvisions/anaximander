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
      this.initializeState(opts || {});
    },

    initializeState: function (opts) {
      this.state = {
        selected: null
      };
      this.setState(
        opts.min || 0,
        opts.max || 1
      );
    },

    setState: function (left, right) {
      if ((left > right) && (!this.state.selected)) {
        throw new Error("the first value must be less than the second");
      }
      this.state.left = Math.max(0, left);
      this.state.right = Math.min(1, right);
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
      this.$(".slider").draggable({
        axis: "x",
        drag: _.bind(this.onDrag, this),
        stop: _.bind(this.onStop, this)
      });
    },

    onDrag: function (event) {
      var combinedSliderWidth = this.dimensions.sliderA.width + this.dimensions.sliderB.width;
      var grooveWidth = this.dimensions.groove.width - combinedSliderWidth;

      var leftPos = parseInt(this.$(".slider-a").css("left"), 10);
      var rightPos = parseInt(this.$(".slider-b").css("left"), 10);

      if (this.getSelectedSlider(event) === "a") {
        this.selectSliderA();
      } else {
        this.selectSliderB();
      }

      var left, right;
      if (this.state.leftAdjusted) {
        left = (leftPos - this.dimensions.sliderA.width) / grooveWidth;
      } else {
        left = leftPos / grooveWidth;
      }

      if (this.state.rightAdjusted) {
        right = (rightPos + this.dimensions.sliderB.width) / grooveWidth;
      } else {
        right = rightPos / grooveWidth;
      }

      this.setState(left, right);

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

      var sliderA_pos = this.state.left * grooveWidth;
      var sliderB_pos = this.state.right * grooveWidth;

      var selectedWidth = this.state.selected === null ? 0 :
        this.state.selected === "a" ? this.dimensions.sliderA.width : this.dimensions.sliderB.width;

      this.state.leftAdjusted = false;
      this.state.rightAdjusted = false;

      if ((this.state.selected === null) || ((sliderB_pos + selectedWidth) > sliderA_pos)) {
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