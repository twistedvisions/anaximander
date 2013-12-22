/*global describe, it */
define(

  ["backbone", "views/login_local"], 

  function (/*Backbone, LoginLocal*/) {

    describe("interaction", function () {

      it("should attach a popover the the login local button");

      it("should hide the popup after registration success");
      it("should log the user in after registration success");
      it("should show a message upon registration failure");

      it("should hide the popup after login success");
      it("should log the user in after login success");
      it("should show a message upon login failure");

      it("should allow a user to cancel logging in by pressing the close button");
      it("should allow a user to cancel logging in by pressing escape");

    });

  }

);