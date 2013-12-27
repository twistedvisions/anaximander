define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "socketio",
  "cookies",
  "../analytics",
  "./login_local",
  "text!templates/login.htm",
  "bootstrap",
  "css!/css/login"
], function ($, _, Backbone, when, io, cookies, Analytics, LoginLocal, template) {
  var loginIdCookieKey = "login-id";
  var Login = Backbone.View.extend({
    el: "#login-holder",

    initialize: function (opts) {
      this.user = opts.user;
    },

    render: function () {
      this.$el.html(template);

      this.updateView();
      this.$("#login").on("click", _.bind(this.handleLogin, this));
      this.$("#logout").on("click", _.bind(this.handleLogout, this));
      this.$("#cancel-login").on("click", _.bind(this.handleCancelLogin, this));
      this.user.on("change:logged-in", this.updateView, this);
      new LoginLocal({
        el: "#login-holder",
        target: "#login-retred",
        user: this.user
      }).render();

      this.$("#login-facebook").on("click", _.bind(this.handleFacebookLogin, this));
      this.$("#login-google").on("click", _.bind(this.handleGoogleLogin, this));
      
      return this.$el;
    },

    updateView: function () {
      if (this.user.get("logged-in")) {
        this.$("#login").hide();
        this.$("#logout").show();
        this.$("#cancel-login").hide();
        this.$("#login-options").hide();
      } else {
        this.$("#logout").hide();
        this.$("#login").show();
        this.$("#cancel-login").hide();
      }
    },

    handleLogin: function () {
      Analytics.loginChoiceShown();
      this.$("#login-options").show();
      this.$("#login").hide();
      this.$("#cancel-login").show();
    },

    handleLogout: function () {
      this.user.logout();
    },

    handleCancelLogin: function () {
      this.$("#login").show();
      this.$("#cancel-login").hide();
      this.$("#login-options").hide();
    },

    handleFacebookLogin: function () {
      Analytics.loginAttempted({
        provider: "facebook"
      });
      when($.get("/auth/facebook", {})).then(
        _.bind(this.handleAuthFacebook, this)
      );
    },
    handleAuthFacebook: function (result) {
      var oldLoginId = cookies.get(loginIdCookieKey);
      var loginId = result.loginId;
      cookies.set(loginIdCookieKey, loginId, {secure: true});

      if (this.socket) {
        this.socket.emit("update-login", {
          "old": oldLoginId,
          "new": loginId
        });
      } else {
        var origin = [
          window.location.protocol,
          "//",
          window.location.hostname,
          (window.location.port ? ":" + window.location.port: "")
        ].join("");
        this.socket = io.connect(origin, {"force new connection": true});
        this.socket.on("connect", _.bind(this.handleWebSocketConnection, this, loginId));
        this.socket.on("complete", _.bind(this.handleLoginCompletion, this));
      }
      window.open(result.location);
    },


    handleGoogleLogin: function () {
      Analytics.loginAttempted({
        provider: "google"
      });
      when($.get("/auth/google", {})).then(
        _.bind(this.handleAuthGoogle, this)
      );
    },
    handleAuthGoogle: function (result) {
      var oldLoginId = cookies.get(loginIdCookieKey);
      var loginId = result.loginId;
      cookies.set(loginIdCookieKey, loginId, {secure: true});

      if (this.socket) {
        this.socket.emit("update-login", {
          "old": oldLoginId,
          "new": loginId
        });
      } else {
        var origin = [
          window.location.protocol,
          "//",
          window.location.hostname,
          (window.location.port ? ":" + window.location.port: "")
        ].join("");
        this.socket = io.connect(origin, {"force new connection": true});
        this.socket.on("connect", _.bind(this.handleWebSocketConnection, this, loginId));
        this.socket.on("complete", _.bind(this.handleLoginCompletion, this));
      }
      window.open(result.location);
    },
    handleWebSocketConnection: function (loginId) {
      this.socket.emit("register-login", {
        key: loginId
      });
    },
    handleLoginCompletion: function (user) {
      Analytics[user.registered ? "register" : "loginSucceeded"](
        _.extend({provider: "facebook"}, user)
      );
      cookies.expire(loginIdCookieKey, {secure: true});
      this.user.set("logged-in", true);
      this.socket.disconnect();
      this.socket = null;
    }

  });

  return Login;

}); 