/*global describe, it, beforeEach, afterEach, sinon */
define(

  ["underscore", "jquery", "backbone", "views/login", "socketio", "cookies", "analytics"], 

  function (_, $, Backbone, Login, socketio, cookies, Analytics) {

    beforeEach(function () {
      this.params = {
        user: new Backbone.Model({
          "logged-in": false
        }),
        el: null,
        id: "login-holder"
      };
      sinon.stub(Analytics, "loginChoiceShown");
    });

    afterEach(function () {
      if (this.el) {
        this.el.remove();
      }
      Analytics.loginChoiceShown.restore();
    });

    var renderLogin = function () {
      this.login = new Login(this.params);
      this.el = this.login.render();
      this.el.appendTo(document.body);
    };

    describe("interaction", function () {

      it("should show the login button if the user is not logged in", function () {
        _.bind(renderLogin, this)();
        this.el.find("#logout").css("display").should.equal("none");
        this.el.find("#login").css("display").should.not.equal("none");
      });

      it("should show the logout button if the user is logged in", function () {
        this.params.user.set("logged-in", true);
        _.bind(renderLogin, this)();
        this.el.find("#logout").css("display").should.not.equal("none");
        this.el.find("#login").css("display").should.equal("none");
      });

      it("should show the login options when the login button is clicked", function () {
        _.bind(renderLogin, this)();
        this.el.find("#login-options").css("display").should.equal("none");
        this.el.find("#cancel-login").css("display").should.equal("none");
        this.el.find("#login").trigger("click");
        this.el.find("#cancel-login").css("display").should.not.equal("none");
        this.el.find("#login-options").css("display").should.not.equal("none");
      });

      it("should show cancel the login when the cancel-login button is clicked", function () {
        _.bind(renderLogin, this)();
        this.el.find("#login").css("display").should.not.equal("none");
        this.el.find("#login").trigger("click");
        this.el.find("#cancel-login").css("display").should.not.equal("none");
        this.el.find("#login-options").css("display").should.not.equal("none");
        this.el.find("#login").css("display").should.equal("none");
        this.el.find("#cancel-login").trigger("click");
        this.el.find("#login-options").css("display").should.equal("none");
        this.el.find("#cancel-login").css("display").should.equal("none");
        this.el.find("#login").css("display").should.not.equal("none");
      });

      it("should track clicks when the login button is clicked", function () {
        _.bind(renderLogin, this)();
        this.el.find("#login").trigger("click");
        Analytics.loginChoiceShown.calledOnce.should.equal(true);
      });

      it("should hide the login options when user has logged in", function () {
        _.bind(renderLogin, this)();
        this.el.find("#login-options").show();
        this.el.find("#login-options").css("display").should.not.equal("none");
        this.params.user.set("logged-in", true);
        this.el.find("#login-options").css("display").should.equal("none");
      });

      describe("facebook-auth", function () {
        beforeEach(function () {
          this.emissions = [];
          sinon.stub($, "get", _.bind(function (_url) {
            this.url = _url;
          }, this));
          sinon.stub(window, "open", function () {});
          sinon.stub(socketio, "connect", _.bind(function () {
            this.connected = true;
            return {
              on: function () {},
              emit: _.bind(function () {
                this.emissions.push(arguments);
              }, this)
            };
          }, this));
          sinon.stub(cookies, "set", _.bind(function () {
            this.setArgs = arguments;
          }, this));

          sinon.stub(Analytics, "loginSucceeded");
          sinon.stub(Analytics, "register");
          sinon.stub(Analytics, "loginAttempted");
        });
        afterEach(function () {
          $.get.restore();
          window.open.restore();
          socketio.connect.restore();
          cookies.set.restore();
          Analytics.loginSucceeded.restore();
          Analytics.register.restore();
          Analytics.loginAttempted.restore();
        });

        it("should call facebook-auth", function () {
          _.bind(renderLogin, this)();
          this.login.handleOpenidLogin("facebook");
          this.url.should.equal("/auth/facebook");
        });

        it("should track facebook-auth", function () {
          _.bind(renderLogin, this)();
          this.login.handleOpenidLogin("facebook");
          Analytics.loginAttempted.calledOnce.should.equal(true);
          Analytics.loginAttempted.args[0][0].provider.should.equal("facebook");
        });

        it("should set the login-id cookie", function () {
          _.bind(renderLogin, this)();
          this.login.handleAuth("facebook", {
            loginId: "someid"
          });

          this.setArgs[0].should.equal("login-id");
          this.setArgs[1].should.equal("someid");
          this.setArgs[2].secure.should.equal(true);
        });

        it("should connect a websocket to tell it when the auth is complete", function () {
          _.bind(renderLogin, this)();
          this.login.handleAuth("facebook", {
            loginId: "someid"
          });
          this.connected.should.equal(true);
        });

        it("should set the user logged in when the auth is complete", function () {
          _.bind(renderLogin, this)();
          this.login.socket = {
            disconnect: function () {}
          };

          this.login.user.get("logged-in").should.equal(false);
          this.login.handleLoginCompletion("facebook", {registered: false});
          this.login.user.get("logged-in").should.equal(true);
        });

        it("should call analytics when the auth is complete when logged in", function () {
          _.bind(renderLogin, this)();
          this.login.socket = {
            disconnect: function () {}
          };
          this.login.handleLoginCompletion("facebook", {registered: false});
          Analytics.loginSucceeded.calledOnce.should.equal(true);
        });

        it("should call analytics when the auth is complete when registered", function () {
          _.bind(renderLogin, this)();
          this.login.socket = {
            disconnect: function () {}
          };
          this.login.handleLoginCompletion("facebook", {registered: true});
          Analytics.register.calledOnce.should.equal(true);
        });

        it("should handle aborting and restarting a login attempt", function () {
          _.bind(renderLogin, this)();
          this.login.handleAuth("facebook", {
            loginId: "someid"
          });
          this.emissions.length.should.equal(0);
          this.login.handleAuth("facebook", {
            loginId: "someotherid"
          });
          this.emissions.length.should.equal(1);
          this.emissions[0][0].should.equal("update-login");
        });
      });

    });

  }

);