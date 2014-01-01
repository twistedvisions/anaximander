/*global sinon, describe, it */
define(
  ["chai", "anax_startup"], 
  function (chai, App) {
    var should = chai.should();
    describe("anax", function () {
      it("should have a default view state", function () {
        should.exist(new App().model);
      });
      it("should fetch a user model to AppView", function () {
        var app = new App();
        sinon.stub(app.user, "fetch");
        app.start();
        app.user.fetch.calledOnce.should.equal(true);
        app.user.fetch.restore();
      });
      //it("should show a nice screen when it cannot fetch a user model");
    });
  }
);