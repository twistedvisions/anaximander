define([], function () {
  return {
    ensureUniversalVariable: function () {
      if (!window.universal_variable) {
        window.universal_variable = {
          events: []
        };
      }
    },
    ensureData: function (data, type) {
      if (!data) {
        data = {};
      }
      data.type = type;
      return data;
    },
    sendEvent: function (data, type) {
      this.ensureUniversalVariable();
      data = this.ensureData(data, type);
      window.universal_variable.events.push(data);
    },
    navigation: function (data) {
      this.sendEvent(data, "navigation");
    },
    infoBoxShown: function (data) {
      this.sendEvent(data, "infoBoxShown");
    },
    linkClicked: function (data) {
      this.sendEvent(data, "linkClicked");
    },
    showFilters: function (data) {
      this.sendEvent(data, "showFilters");
    },
    filterEventsByPrimary: function (data) {
      this.sendEvent(data, "filterEventsByPrimary");
    },
    filterEventsBySecondary: function (data) {
      this.sendEvent(data, "filterEventsBySecondary");
    },
    filterSecondaryFilters: function (data) {
      this.sendEvent(data, "filterSecondaryFilters");
    },
    toggleSecondaryFilterSelection: function (data) {
      this.sendEvent(data, "toggleSecondaryFilterSelection");
    },
    loginChoiceShown: function (data) {
      this.sendEvent(data, "loginChoiceShown");
    },
    loginAttempted: function (data) {
      this.sendEvent(data, "loginAttempted");
    },
    loginSucceeded: function (data) {
      this.sendEvent(data, "loginSucceeded");
    },
    loginFailed: function (data) {
      this.sendEvent(data, "loginFailed");
    },
    logout: function (data) {
      this.sendEvent(data, "logout");
    },
    register: function (data) {
      this.sendEvent(data, "register");
    }
  };
});