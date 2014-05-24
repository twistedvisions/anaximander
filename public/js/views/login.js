define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "socketio",
  "cookies",
  "analytics",
  "views/login_local",
  "models/current_user",
  "text!templates/login.htm",
  "bootstrap",
  "less!../../css/login"
], function ($, _, Backbone, when, io, cookies, Analytics, LoginLocal, User, template) {
  var loginIdCookieKey = "login-id";
  var Login = Backbone.View.extend({
    el: "#login-holder",

    initialize: function (/*opts*/) {
    },

    render: function () {
      this.$el.html(template);

      this.updateView();
      this.$("#login").on("click", _.bind(this.handleLogin, this));
      this.$("#logout").on("click", _.bind(this.handleLogout, this));
      this.$("#cancel-login").on("click", _.bind(this.handleCancelLogin, this));
      User.user.on("change:logged-in", this.updateView, this);
      new LoginLocal({
        el: "#login-holder",
        target: "#login-retred"
      }).render();

      this.$("#login-facebook").on("click", _.bind(this.handleOpenidLogin, this, "facebook"));
      this.$("#login-google").on("click", _.bind(this.handleOpenidLogin, this, "google"));
      this.$("#login-twitter").on("click", _.bind(this.handleOpenidLogin, this, "twitter"));
      this.$("#login-github").on("click", _.bind(this.handleOpenidLogin, this, "github"));

      return this.$el;
    },

    updateView: function () {
      this.$("#login-options").hide();
      if (User.user.get("logged-in")) {
        this.$("#login").hide();
        this.$("#logout").show();
        this.$("#cancel-login").hide();
      } else {
        this.$("#logout").hide();
        this.$("#login").show();
        this.$("#cancel-login").hide();
      }
    },

    handleLogin: function () {
      Analytics.loginChoiceShown();
      this.$("#login-options").show();
      this.$(".login-option").removeClass("loading");
      this.$("#login").hide();
      this.$("#cancel-login").show();
    },

    handleLogout: function () {
      User.user.logout();
    },

    handleCancelLogin: function () {
      this.$("#login").show();
      this.$("#cancel-login").hide();
      this.$("#login-options").hide();
    },

    handleOpenidLogin: function (provider) {
      this.$("#login-" + provider).addClass("loading");
      Analytics.loginAttempted({
        provider: provider
      });
      when($.get("/auth/" + provider, {})).then(
        _.bind(this.handleAuth, this, provider)
      );
    },

    handleAuth: function (provider, result) {
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
        this.socket.on("complete", _.bind(this.handleLoginCompletion, this, provider));
      }

      var sizes = {
        google: "height=630,width=450",
        twitter: "height=711,width=645",
        facebook: "height=621,width=983",
        github: "height=595,width=1023"
      };
      window.open(result.location, "", sizes[provider] + ",location=no,menubar=no");
    },

    handleWebSocketConnection: function (loginId) {
      this.socket.emit("register-login", {
        key: loginId
      });
    },

    handleLoginCompletion: function (provider, user) {
      Analytics[user.registered ? "register" : "loginSucceeded"](
        _.extend({provider: provider}, user)
      );
      cookies.expire(loginIdCookieKey, {secure: true});
      User.user.set("logged-in", true);
      User.user.set("permissions", user.permissions);
      this.socket.disconnect();
      this.socket = null;
    }

  });

  return Login;

});