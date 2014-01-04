/*global console*/
define([
  "underscore",
  "views/app",
  "router",
  "models/view_state",
  "models/current_user",
  "css!/css/anax"
], function (_, AppView, Router, ViewState, User) {
  var App = function () {
    this.model = new ViewState({
      date: [1963, 2014],
      center: [53.24112905344493, 6.191539001464932],
      zoom: 9,
      radius: 10
    });
    var permissions = [];
    if (window.location.href.indexOf("login") > -1) {
      permissions = [{id: 1, name: "login"}];
    }
    this.user = new User({
      id: -1,
      permissions: permissions
    });
  };
  App.prototype.start = function () {
    this.user.fetch({
      success: _.bind(this.handleUserFetchSuccess, this),
      failure: _.bind(this.handleUserFetchFailure, this)
    });
  };
  App.prototype.handleUserFetchSuccess = function () {
    var appView = new AppView({
      model: this.model,
      user: this.user
    });
    appView.render();
    this.router = new Router();
    this.router.init({
      model: this.model
    });
  };
  App.prototype.handleUserFetchFailure = function () {
    console.log("failed to log in");
  };
  return App;
});