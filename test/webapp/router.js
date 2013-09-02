/*global sinon, describe, before, after, beforeEach, afterEach, it */
define(
  ["backbone", "router"], 
  function (Backbone, Router) {
    afterEach(function () {
      Backbone.history.stop();
    });
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
      describe("interaction", function () {
        before(function () {
          sinon.stub(Backbone.history, "getFragment", function () {
            return "lat/50.54495764863934/lon/20.716353047688926/zoom/5/start/1349/end/1572";
          });
        });
        it("should set lastEvent to 'url_change'", function () {
          var model = new Backbone.Model({
            center: [1, 2],
            date: [1900, 2000],
            zoom: 3
          });
          
          var router = new Router();
          router.init({model: model});
          window.lastEvent.should.equal("url_change");
        });
        after(function () {
          sinon.restore(Backbone.history.getFragment);
        })
      });
    });
  }
);
