/*global sinon, describe, it, beforeEach, afterEach */
define(

  ["jquery", "backbone", "views/date_selector"],

  function ($, Backbone, DateSelector) {

    describe("date selector", function () {

      it("should return the date", function () {
        var dateSelector = new DateSelector({
          date: new Date(1990, 06, 04, 11, 43)
        });
        dateSelector.getDate().should.eql(new Date(1990, 06, 04, 11, 43));
      });

      it("should set the date on the linked input", function () {
        this.linkedInput = $("<input type='text'>");
        this.dateSelector = new DateSelector({
          date: new Date(2014, 6, 1, 11, 43),
          input: this.linkedInput
        });
        this.dateSelector.render();
        this.linkedInput.val().should.equal("2014-07-01 11:43");
      });

      it("should update the date when the linked input is typed into", function () {
        this.linkedInput = $("<input type='text'>");
        this.dateSelector = new DateSelector({
          date: new Date(2014, 6, 1, 11, 43),
          input: this.linkedInput
        });
        this.dateSelector.render();
        this.linkedInput.val("2014-01-01 11:43");
        this.linkedInput.trigger("keyup");
        this.dateSelector.getDate().should.eql(new Date(2014, 0, 1, 11, 43));
      });

      it("should update the date when the linked input is typed into, even in non-standard formats", function () {
        this.linkedInput = $("<input type='text'>");
        this.dateSelector = new DateSelector({
          date: new Date(2014, 6, 1, 11, 43),
          input: this.linkedInput
        });
        this.dateSelector.render();
        this.linkedInput.val("Jun 16 1954");
        this.linkedInput.trigger("keyup");
        this.dateSelector.getDate().should.eql(new Date(1954, 5, 16, 0, 0));
      });

      it("should not update the date while the month text is not in the correct format", function () {
        this.linkedInput = $("<input type='text'>");
        this.dateSelector = new DateSelector({
          date: new Date(2014, 6, 1, 11, 43),
          input: this.linkedInput
        });
        this.dateSelector.render();
        this.linkedInput.val("2014-0-01 11:43");
        sinon.stub(this.dateSelector, "inputDoesNotMatch");
        this.linkedInput.trigger("keyup");
        this.dateSelector.inputDoesNotMatch.calledOnce.should.equal(true);
        this.dateSelector.getDate().should.eql(new Date(2014, 6, 1, 11, 43));
      });

      it("should not update the date while the year text is not in the correct format", function () {
        this.linkedInput = $("<input type='text'>");
        this.dateSelector = new DateSelector({
          date: new Date(2014, 6, 1, 11, 43),
          input: this.linkedInput
        });
        this.dateSelector.render();
        this.linkedInput.val("294-01-01 11:43");
        sinon.stub(this.dateSelector, "inputDoesNotMatch");
        this.linkedInput.trigger("keyup");
        this.dateSelector.inputDoesNotMatch.calledOnce.should.equal(true);
        this.dateSelector.getDate().should.eql(new Date(2014, 6, 1, 11, 43));
      });

      it("should not update the date if it is the same", function () {
        this.linkedInput = $("<input type='text'>");
        this.dateSelector = new DateSelector({
          date: new Date(2014, 6, 1, 11, 43),
          input: this.linkedInput
        });
        this.dateSelector.render();
        this.linkedInput.val("2014-07-01 11:43");
        sinon.spy(this.linkedInput, "val");
        this.linkedInput.trigger("keyup");
        this.linkedInput.val.calledWith("2014-07-01 11:43").should.equal(false);
      });

      describe("summary", function () {
        it("should show the date when > 0", function () {
          this.dateSelector = new DateSelector({
            date: new Date(2014, 6, 1, 11, 43)
          });
          this.dateSelector.render();
          this.dateSelector.$(".date-summary .value").text().should.equal("2014-07-01 CE");
        });
        it("should show the date when < 0", function () {
          this.dateSelector = new DateSelector({
            date: new Date(-2014, 6, 1, 11, 43)
          });
          this.dateSelector.render();
          this.dateSelector.$(".date-summary .value").text().should.equal("2014-07-01 BCE");
        });
      });

      describe("years", function () {
        it("should show the current year", function () {
          var dateSelector = new DateSelector({
            date: new Date(1990, 06, 04, 11, 43)
          });
          dateSelector.render();
          dateSelector.$(".year-holder .selected").data().value.should.equal(1990);
        });
        it("should not show the year 0", function () {
          var dateSelector = new DateSelector({
            date: new Date(-1, 06, 04, 11, 43)
          });
          dateSelector.render();
          dateSelector.$(".year-holder .selected").data().value.should.equal(-1);
          dateSelector.$(".year-holder .selected").next().data().value.should.equal(1);
        });
        it("should not change the base year when a year is selected", function () {
          var dateSelector = new DateSelector({
            date: new Date(1990, 06, 04, 11, 43)
          });
          dateSelector.render();
          dateSelector.$(".year-holder .years div:nth-child(1)").data().value.should.equal(1985);
          dateSelector.$(".year-holder .years div:nth-child(1)").click();
          dateSelector.$(".year-holder .years div:nth-child(1)").data().value.should.equal(1985);
        });
        describe("navigation", function () {
          beforeEach(function () {
            this.dateSelector = new DateSelector({
              date: new Date(1990, 06, 04, 11, 43)
            });
            this.dateSelector.render();
            sinon.spy(this.dateSelector, "redraw");
          });
          [500, 75, 10].forEach(function (year) {
            ["minus", "plus"].forEach(function (direction) {
              describe(direction + " " + year + " years clicked", function () {
                beforeEach(function () {
                  this.amount = (direction === "plus" ? year : -year);
                  var selector = ".year-holder ." + direction + "[data-year=" + year + "]";
                  this.dateSelector.$(selector).click();
                });
                it("should change the date", function () {
                  this.dateSelector.getDate().getFullYear().should.equal(1990 + this.amount);
                });
                it("should update the visible date after it was clicked", function () {
                  this.dateSelector.$(".year-holder .selected").data().value.should.equal((1990 + this.amount));
                });
                it("should redraw itself", function () {
                  this.dateSelector.redraw.reset();
                  this.dateSelector.$(".year-holder .selected").click();
                  this.dateSelector.redraw.calledOnce.should.equal(true);
                });
                it("should change the base year", function () {
                  this.dateSelector.$(".year-holder .years div:nth-child(1)").data().value.should.equal((1990 + this.amount - 5));
                });
              });
            });
          });
        });
      });

      describe("months", function () {
        ["jan", "feb", "mar", "apr", "may", "jun",
         "jul", "aug", "sep", "oct", "nov", "dec"].forEach(function (month, i) {

          describe(month, function () {
            beforeEach(function () {
              this.dateSelector = new DateSelector({
                date: new Date(1990, i === 6 ? 5 : 6, 04, 11, 43)
              });
              sinon.spy(this.dateSelector, "redraw");
              this.dateSelector.render();
              this.selector = ".month-holder [data-month=" + i + "]";
            });
            it("should set the month", function () {
              this.dateSelector.$(this.selector).click();
              this.dateSelector.getDate().getMonth().should.equal(i);
            });
            it("should select the month", function () {
              this.dateSelector.$(this.selector + ".selected").length.should.equal(0);
              this.dateSelector.$(this.selector).click();
              this.dateSelector.$(this.selector + ".selected").length.should.equal(1);
            });
            it("should redraw the dates", function () {
              this.dateSelector.redraw.reset();
              this.dateSelector.$(this.selector).click();
              this.dateSelector.redraw.calledOnce.should.equal(true);
            });
          });
        });
      });

      describe("days", function () {
        describe("rendering", function () {
          beforeEach(function () {
            this.dateSelector = new DateSelector({
              date: new Date(2014, 6, 1, 11, 43)
            });
            this.dateSelector.render();
          });
          it("should set the first day as Tuesday", function () {
            this.dateSelector.$(".day-holder tbody tr:nth-child(1) td:nth-child(3)").text().should.equal("1");
          });
          it("should set the first Sunday as the 6th", function () {
            this.dateSelector.$(".day-holder tbody tr:nth-child(2) td:nth-child(1)").text().should.equal("6");
          });
        });

        describe("interactions", function () {
          beforeEach(function () {
            this.dateSelector = new DateSelector({
              date: new Date(2014, 6, 1, 11, 43)
            });
            this.dateSelector.render();
            sinon.spy(this.dateSelector, "redraw");
            this.selector = ".day-holder tbody tr:nth-child(2) td:nth-child(2)";
          });
          it("should set the date on click", function () {
            this.dateSelector.$(this.selector).click();
            this.dateSelector.getDate().getDate().should.equal(7);
          });
          it("should select the date", function () {
            this.dateSelector.$(this.selector).click();
            this.dateSelector.$(this.selector + ".selected").length.should.equal(1);
          });
          it("should redraw itself", function () {
            this.dateSelector.redraw.reset();
            this.dateSelector.$(this.selector).click();
            this.dateSelector.redraw.calledOnce.should.equal(true);
          });
        });

        describe("date changing", function () {
          beforeEach(function () {
            this.parent = $("<div>");
            this.parent.appendTo($("body"));
            this.linkedInput = $("<input type='text'>");
            this.parent.append(this.linkedInput);
            this.dateSelector = new DateSelector({
              date: new Date(2014, 6, 1, 11, 43),
              input: this.linkedInput
            });
            this.dateSelector.render();
            this.linkedInput.popover("show");
          });
          afterEach(function () {
            this.parent.remove();
          });
          it("should set the date on the linked input", function () {
            this.dateSelector.$(".month-holder [data-month=0]").click();
            this.linkedInput.val().should.equal("2014-01-01 11:43");
          });
          it("should trigger an event", function () {
            var newDate;
            this.dateSelector.on("change", function (date) {
              newDate = date;
            });
            this.dateSelector.$(".month-holder [data-month=0]").click();
            newDate.should.eql(new Date(2014, 0, 1, 11, 43));
          });
        });

        describe("6 week months", function () {
          it("should add a class to the table", function () {
            this.dateSelector = new DateSelector({
              date: new Date(2014, 7, 1)
            });
            this.dateSelector.render();
            this.dateSelector.$(".day-holder.long-month").length.should.equal(1);
          });
        });
      });


      describe("hours", function () {
        it("should set the hour slider", function () {
          this.dateSelector = new DateSelector({
            date: new Date(2014, 7, 1, 15, 37)
          });
          this.dateSelector.render();
          this.dateSelector.$(".hour-slider").slider("value").should.equal(15);
        });
      });
      describe("minutes", function () {
        it("should set the minute slider", function () {
          this.dateSelector = new DateSelector({
            date: new Date(2014, 7, 1, 15, 37)
          });
          this.dateSelector.render();
          this.dateSelector.$(".minute-slider").slider("value").should.equal(37);
        });
      });
    });

  }

);
