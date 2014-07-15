define([
  "jquery",
  "underscore",
  "backbone",
  "moment",
  "text!templates/date_selector.htm",
  "underscore_string",
  "less!../../css/date_selector"
], function ($, _, Backbone, moment, template) {

  var DateSelector = Backbone.View.extend({
    initialize: function (opts) {
      opts = opts || {};
      this.date = opts.date;
      this.setBaseYear();
      this.boundInput = opts.input;
    },

    render: function () {
      this.renderTemplate();
      return this;
    },

    setDate: function (date) {
      this.date = date;
      this.updateInput();
      this.setBaseYear();
      this.redraw();
      this.triggerChange();
    },

    renderTemplate: function () {
      if (this.boundInput) {
        this.boundInput.popover({
          placement: "auto top",
          html: true,
          animation: false,
          trigger: "manual",
          content: template
        });
        this.boundInput.val(this.getText());
        this.boundInput.on("shown.bs.popover", _.bind(this.handlePopupShown, this));
        this.redraw();
      } else {
        this.$el.html(template);
        this.renderSliders();
        this.redraw();
      }
    },

    setBaseYear: function () {
      this.baseYear = this.date.getFullYear();
    },

    renderSliders: function () {
      this.$(".hour-slider").slider({
        orientation: "horizontal",
        min: 0,
        max: 23,
        value: this.date.getHours(),
        slide: _.bind(this.handleHourSlide, this)
      });

      this.$(".minute-slider").slider({
        orientation: "horizontal",
        min: 0,
        max: 59,
        value: this.date.getMinutes(),
        slide: _.bind(this.handleMinuteSlide, this)
      });
    },

    handleHourSlide: function (e, result) {
      this.date.setHours(result.value);
      this.redraw();
      this.triggerChange();
    },

    handleMinuteSlide: function (e, result) {
      this.date.setMinutes(result.value);
      this.redraw();
      this.triggerChange();
    },

    getText: function () {
      return moment(this.date).format("YYYY-MM-DD HH:mm");
    },

    handlePopupShown: function () {
      this.attached = false;
      this.$el = this.boundInput.parent().find(".popover");
      this.$ = _.bind(this.$el.find, this.$el);
      this.renderSliders();
      this.redraw();
      this.trigger("show");
    },

    attachListeners: function () {
      if (!this.attached) {
        this.attached = true;
        if (this.boundInput) {
          this.boundInput.on("click", _.bind(this.showPopup, this));
          this.boundInput.on("keyup", _.bind(this.handleInputKeyup, this));
        }
        this.$(".year-holder .change-year").on("click", _.bind(this.changeYearRange, this));
        this.$(".month-holder div").on("click", _.bind(this.selectMonth, this));
        this.$(".done.btn").on("click", _.bind(this.hidePopup, this));
      }
      this.$(".year-holder .years div").on("click", _.bind(this.selectYear, this));
      this.$(".day-holder tbody td").on("click", _.bind(this.selectDay, this));
    },

    handleInputKeyup: function () {
      var value = this.boundInput.val();
      if (value.match(/\d\d\d\d\-\d\d\-\d\d \d\d:\d\d/)) {
        this.date = moment(value, "YYYY-MM-DD HH:mm").toDate();
        this.setBaseYear();
        this.redraw();
        this.triggerChange();
      } else if (value.match(/\d\d\d\-\d\d\-\d\d \d\d:\d\d|\d\d\-\d\d\-\d\d \d\d:\d\d|\d\-\d\d\-\d\d \d\d:\d\d|\d\d\d\d\-\d\-\d\d \d\d:\d\d|\d\d\d\d\-\d\d\-\d \d\d:\d\d|\d\d\d\d\-\d\d\-\d\d \d:\d\d|\d\d\d\d\-\d\d\-\d\d \d\d:\d/)) {
        this.inputDoesNotMatch();
      } else {
        var newDate = moment(new Date(value));
        if (!isNaN(newDate.valueOf())) {
          this.date = newDate.toDate();
          this.setBaseYear();
          this.redraw();
          this.triggerChange();
        }
      }
    },

    inputDoesNotMatch: function () {
      //just for testing
    },

    showPopup: function () {
      if (!this.popupShowing) {
        this.baseYear = this.date.getFullYear();
        this.boundInput.popover("show");
        this.popupShowing = true;
      }
    },

    hidePopup: function () {
      if (this.boundInput) {
        this.boundInput.popover("hide");
        this.popupShowing = false;
        if (!$("body").hasClass("modal-open")) {
          $("body").addClass("modal-open");
        }
      }
    },

    changeYearRange: function (e) {
      var el = $(e.target);
      var classes = _.groupBy(el.prop("class").split(" "));
      var sign = 1;
      if (classes.minus) {
        sign = -1;
      }
      var amount = el.data().year;
      this.date.setFullYear(this.date.getFullYear() + sign * amount);
      this.baseYear += sign * amount;
      this.redraw();
    },

    selectYear: function (e) {
      var el = $(e.target);
      this.date.setFullYear(el.data().value);
      this.redraw();
      this.triggerChange();
    },

    selectMonth: function (e) {
      var el = $(e.target);
      this.date.setMonth(el.data().month);
      this.redraw();
      this.triggerChange();
    },

    selectDay: function (e) {
      var el = $(e.target);
      var date = el.text();
      if (date) {
        this.date.setDate(parseInt(date, 10));
      }
      //todo: is this necessary?
      this.redraw();
      this.triggerChange();
    },

    triggerChange: function () {
      this.trigger("change", this.date);
    },

    redraw: function () {
      this.drawDate();
      this.drawYears();
      this.drawMonths();
      this.drawDays();
      this.drawTime();
      this.drawHours();
      this.drawMinutes();
      this.attachListeners();
      this.updateInput();
    },

    drawDate: function () {
      this.$(".date-summary .value").text([
        Math.abs(this.date.getFullYear()),
        _.string.lpad(this.date.getMonth() + 1, 2, "0"),
        _.string.lpad(this.date.getDate(), 2, "0"),
      ].join("-") + " " + (this.date.getFullYear() > 0 ? "CE" : "BCE"));
    },

    drawYears: function () {
      this.$(".years").html("");
      var year = this.date.getFullYear();
      var offset = 0;
      _.each(_.range(this.baseYear - 5, this.baseYear + 5), function (currentYear) {
        if (currentYear === 0) {
          offset = 1;
        }
        currentYear += offset;
        //\u200b is a breaking space
        var yearStr = _.string.lpad(Math.abs(currentYear), 4, "0").split("").join("\u200b");
        var el = $("<div data-value='" + (currentYear) + "'>" + yearStr + "</div>");
        if (year === currentYear) {
          el.addClass("selected");
        }
        this.$(".years").append(el);
      }, this);
    },

    drawMonths: function () {
      this.$(".month-holder div").removeClass("selected");
      this.$(".month-holder div[data-month=" + this.date.getMonth() + "]").addClass("selected");
    },

    drawDays: function () {
      this.$(".day-holder tbody").html("");
      var table = this.$(".day-holder tbody");
      var firstDay = this.getFirstDayOfMonth();
      var tr = $("<tr>");
      var day = 1;
      var week = 1;
      var daysInMonth = this.getDaysInMonth();
      _.each(_.range(0, firstDay), function () {
        tr.append($("<td>"));
      });
      _.each(_.range(firstDay, 7), function () {
        tr.append($("<td data-value='" + day + "'>" + day + "</td>"));
        day += 1;
      });
      table.append(tr);
      while (day <= daysInMonth) {
        tr = $("<tr>");
        _.each(
          _.range(day, day + 7),
          _.bind(this.addDateCell, this, daysInMonth, tr)
        );
        table.append(tr);
        day += 7;
        week += 1;
      }
      if (week === 6) {
        this.$(".day-holder").addClass("long-month");
      } else {
        this.$(".day-holder").removeClass("long-month");
      }
      this.$(".day-holder td").removeClass("selected");
      this.$(".day-holder td[data-value=" + this.date.getDate() + "]").addClass("selected");
    },

    addDateCell: function (daysInMonth, tr, day) {
      if (day <= daysInMonth) {
        tr.append($("<td data-value='" + day + "'>" + day + "</td>"));
      }
    },

    getFirstDayOfMonth: function () {
      var startOfMonth = new Date(this.date);
      startOfMonth.setDate(1);
      return startOfMonth.getDay();
    },

    getDaysInMonth: function () {
      var endOfMonth = new Date(this.date);
      endOfMonth.setDate(1);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(endOfMonth.getDate() - 1);
      return endOfMonth.getDate();
    },

    drawTime: function () {
      this.$(".time-summary .value").text([
        _.string.lpad(this.date.getHours(), 2, "0"),
        _.string.lpad(this.date.getMinutes(), 2, "0")
      ].join(":"));
    },

    drawHours: function () {
      this.$(".hour-slider").slider({
        value: this.date.getHours()
      });
    },

    drawMinutes: function () {
      this.$(".minute-slider").slider({
        value: this.date.getMinutes()
      });
    },

    getDate: function () {
      return this.date;
    },

    updateInput: function () {
      if (this.boundInput) {
        var currentValue = this.boundInput.val();
        var newValue = this.getText();
        if (currentValue !== newValue) {
          this.boundInput.val(newValue);
        }
      }
    }
  });

  return DateSelector;
});