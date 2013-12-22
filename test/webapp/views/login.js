/*global  describe, it */
define(

  ["backbone", "jquery", "views/login"], 

  function (Backbone, $, Login) {

    describe("interaction", function () {

      it("should show the login button if the user is not logged in", function () {
        var login = new Login({
          user: new Backbone.Model({
            "logged-in": false
          }),
          el: null,
          id: "login-holder"
        });
        var el = login.render();
        el.find("#logout").css("display").should.equal("none");
        el.find("#login").css("display").should.not.equal("none");
      });

      it("should show the logout button if the user is logged in", function () {
        var login = new Login({
          user: new Backbone.Model({
            "logged-in": true
          }),
          el: null,
          id: "login-holder"
        });
        var el = login.render();
        el.find("#logout").css("display").should.not.equal("none");
        el.find("#login").css("display").should.equal("none");
      });

      it("should show the login options when the login button is clicked", function () {
        var login = new Login({
          user: new Backbone.Model({
            "logged-in": false
          }),
          el: null,
          id: "login-holder"
        });
        var el = login.render();
        el.appendTo(document.body);
        el.find("#login-options").css("display").should.equal("none");
        el.find("#login").trigger("click");
        el.find("#login-options").css("display").should.not.equal("none");
        el.remove();
      });
      it("should hide the login options when user has logged in");

      describe("facebook-auth", function () {
        it("should call facebook-auth");
        it("should set the login-id cookie");
        it("should connect a websocket to tell it when the auth is complete");
        it("should set the user logged in when the auth is complete");
        it("should handle aborting and restarting a login attempt");
      });

    });

  }

);