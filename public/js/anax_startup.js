/*global console*/
define([
  "less!../css/anax",
  "underscore",
  "views/app",
  "router",
  "models/view_state",
  "models/current_user",
  "analytics"
], function (styles, _, AppView, Router, ViewState, User, Analytics) {
  var App = function () {
    var defaultState = {
      date: [1963, 2014],
      center: [53.24112905344493, 6.191539001464932],
      zoom: 9,
      radius: 10,
      importance: 8
    };
    this.setGeoLocation(defaultState);
    var storedData = this.getStoredData();
    var data = _.extend(defaultState, storedData);
    this.model = new ViewState(data);
    defaultState.set = true;
    var permissions = [{id: 1, name: "login"}];
    User.user = new User({
      id: -1,
      permissions: permissions
    });
  };
  App.prototype.setGeoLocation = function (defaultState) {
    var geolocation = this.getGeolocationObject();
    if (geolocation) {
      geolocation.getCurrentPosition(_.bind(function (position) {
        if (position && position.coords) {
          var latitude = position.coords.latitude;
          var longitude = position.coords.longitude;
          var value = [latitude, longitude];
          if (!defaultState.set) {
            defaultState.center = value;
          } else if (!this.readLocalData && (!this.router || !this.router.initialisedByUrl)) {
            this.model.set("center", value);
          }
        }
      }, this));
    }
  };
  App.prototype.getGeolocationObject = function () {
    return navigator.geolocation;
  };
  App.prototype.getStoredData = function () {
    try {
      var geoData = JSON.parse(this.getLocalStorageState());
      if (geoData && (_.keys(geoData).length > 0)) {
        this.readLocalData = true;
      }
      return geoData;
    } catch (e) {
      return {};
    }
  };
  App.prototype.getLocalStorageState = function () {
    return localStorage.getItem("retred_viewstate");
  };
  App.prototype.start = function () {
    User.user.fetch({
      success: _.bind(this.handleUserFetchSuccess, this),
      failure: _.bind(this.handleUserFetchFailure, this)
    });
  };
  App.prototype.handleUserFetchSuccess = function (user) {
    var appView = new AppView({
      model: this.model
    });
    appView.render();
    if (user.get("id") !== -1) {
      Analytics.loginSucceeded(user.toJSON());
    }
    this.startRouter();
  };
  App.prototype.startRouter = function () {
    this.router = new Router();
    this.router.init({
      model: this.model
    });
    this.model.trigger("change");
  };
  App.prototype.handleUserFetchFailure = function () {
    console.log("failed to log in");
  };
  return App;
});