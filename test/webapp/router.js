/*global sinon, describe, before, after, beforeEach, afterEach, it */
define(
  ["backbone", "../../public/js/router.js"], 
  function (Backbone, Router) {
    describe("router", function () {
      it("should navigate on model changes", function () {
        var model = new Backbone.Model({
          center: [1, 1],
          date: [1900, 2000],
          zoom: 3
        });
        var router = new Router();
        router.init({model: model});
        var navigate = sinon.stub(router, "navigate");
        model.set("zoom", 2);
        navigate.calledOnce.should.be.true;
      });
    });
  }
);
