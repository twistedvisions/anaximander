/*global sinon, describe, it, beforeEach, afterEach */
define(
  ["jquery", "models/current_user", "analytics"], 
  function ($, CurrentUser, Analytics) {
    describe("current user", function () {

      beforeEach(function () {
        sinon.stub($, "post", function (url, f) { f(); });
        sinon.stub(Analytics, "logout");
      });
      afterEach(function () {
        $.post.restore();
        Analytics.logout.restore();
      });

      it("should logout a logged in user", function () {
        new CurrentUser({
          "logged-in": true
        }).logout();
        $.post.calledWith("/logout").should.equal(true);
      });

      it("should send analytics", function () {
        new CurrentUser({
          "logged-in": true
        }).logout();
        Analytics.logout.calledOnce.should.equal(true);
      });

      it("should not logout user that is not logged in", function () {
        new CurrentUser({
          "logged-in": false
        }).logout();
        $.post.called.should.equal(false);
      });

      it("should index permissions", function () {
        var user = new CurrentUser({
          "logged-in": false,
          permissions: [
            {id: 1, name: "name1"},
            {id: 2, name: "name2"}
          ]
        });
        user.get("permissionMap").should.eql({
          name1:  {id: 1, name: "name1"},
          name2:  {id: 2, name: "name2"}
        });
      });

      it("should get permissions", function () {
        var user = new CurrentUser({
          "logged-in": false,
          permissions: [
            {id: 1, name: "name1"},
            {id: 2, name: "name2"}
          ]
        });
        user.hasPermission("name1").should.equal(true);
        user.hasPermission("name3").should.equal(false);
      });
    });
  }
);
