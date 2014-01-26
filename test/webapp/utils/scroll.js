/*global describe, it, beforeEach, afterEach */
define(

  ["underscore", "jquery", "utils/scroll"],

  function (_, $, Scroll) {
    describe("scroll", function () {
      describe("into view", function () {
        beforeEach(function () {
          this.parentEl = $("<ul id='search-box'></ul>");
          this.parentEl.appendTo(document.body);

          var i = 0;
          _.times(40, function () {
            i += 1;
            var el = $("<li style='height=20;' class='search-result' data-id='" + i + "'>text</li>");
            el.appendTo(this.parentEl);
          }, this);
          this.parentEl.height(100);
          this.parentEl.css("overflow-y", "auto");
        });
        afterEach(function () {
          this.parentEl.remove();
        });
        it("should scroll the result into view if it is above the visible area", function () {
          this.parentEl.scrollTop(500);
          this.parentEl.scrollTop().should.equal(500);
          Scroll.intoView($("li[data-id=" + 1 + "]"), this.parentEl);
          this.parentEl.scrollTop().should.be.lessThan(500);
        });
        it("should scroll the result into view if it is below the visible area", function () {
          this.parentEl.scrollTop().should.equal(0);
          Scroll.intoView($("li[data-id=" + 30 + "]"), this.parentEl);
          this.parentEl.scrollTop().should.be.greaterThan(0);
        });
        it("should not scroll the result into view if it is visible", function () {
          this.parentEl.scrollTop(30);
          this.parentEl.scrollTop().should.equal(30);
          Scroll.intoView($("li[data-id=" + 3 + "]"), this.parentEl);
          this.parentEl.scrollTop().should.equal(30);
        });
        it("should leave an offset before the element", function () {
          this.parentEl.scrollTop(0);
          this.parentEl.scrollTop().should.equal(0);
          Scroll.intoView($("li[data-id=" + 10 + "]"), this.parentEl);
          var top = this.parentEl.scrollTop();
          Scroll.intoView($("li[data-id=" + 1 + "]"), this.parentEl);
          Scroll.intoView($("li[data-id=" + 10 + "]"), this.parentEl, 20);
          this.parentEl.scrollTop().should.equal(top - 20);
        });
      });
    });
  }
);