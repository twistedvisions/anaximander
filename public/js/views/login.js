define([
  "jquery",
  "underscore",
  "backbone",
  "when",
  "socketio",
  "cookies",
  "./login_local",
  "text!templates/login.htm",
  "bootstrap",
  "css!/css/login"
], function ($, _, Backbone, when, io, cookies, LoginLocal, template) {

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
      this.user.on("change:logged-in", this.updateView, this);
      new LoginLocal({
        el: "#login-holder",
        target: "#login-retred",
        user: this.user
      }).render();

      this.$("#login-facebook").on("click", _.bind(this.handleFacebookLogin, this));
      
      return this.$el;
    },

    updateView: function () {
      if (this.user.get("logged-in")) {
        this.$("#login").hide();
        this.$("#logout").show();
        this.$("#login-options").hide();
      } else {
        this.$("#logout").hide();
        this.$("#login").show();
      }
    },

    handleLogin: function () {
      this.$("#login-options").show();
    },

    handleLogout: function () {
      this.user.logout();
    },

    handleFacebookLogin: function () {

      when($.get("/auth/facebook", {})).then(
        _.bind(function (result) {
          var loginId = result.loginId;
          cookies.set("login-id", loginId);
          var socket = io.connect("http://localhost:8000");
          socket.on("connect", function () {
            socket.emit("register-login", {
              key: loginId
            });
          });
          socket.on("complete", _.bind(function (/*data*/) {
            this.user.set("logged-in", true);
          }, this));
          window.open(result.location);
          
        }, this)
      );
    }

  });

  return Login;

});