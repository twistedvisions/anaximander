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

    //map
    navigation: function (data) {
      this.sendEvent(data, "navigation");
    },
    infoBoxShown: function (data) {
      this.sendEvent(data, "infoBoxShown");
    },
    linkClicked: function (data) {
      this.sendEvent(data, "linkClicked");
    },
    mapEntrySearched: function (data) {
      this.sendEvent(data, "mapEntrySearched");
    },

    //search
    searchBoxCharacterTyped: function (data) {
      this.sendEvent(data, "searchBoxCharacterTyped");
    },
    searchBoxStringTyped: function (data) {
      this.sendEvent(data, "searchBoxStringTyped");
    },
    searchBoxCleared: function (data) {
      this.sendEvent(data, "searchBoxCleared");
    },
    searchEntryLinkClicked: function (data) {
      this.sendEvent(data, "searchLinkClicked");
    },
    searchEntryClicked: function (data) {
      this.sendEvent(data, "searchLinkClicked");
    },
    hideSearchResults: function (data) {
      this.sendEvent(data, "hideSearchResults");
    },
    searchSubmitted: function (data) {
      this.sendEvent(data, "searchSubmitted");
    },
    searchPasted: function (data) {
      this.sendEvent(data, "searchPasted");
    },
    searchCopied: function (data) {
      this.sendEvent(data, "searchCopied");
    },

    //period selector
    periodSelectorOpened: function (data) {
      this.sendEvent(data, "periodSelectorOpened");
    },
    periodSelected: function (data) {
      this.sendEvent(data, "periodSelected");
    },

    //adding events
    optionsMenuShown: function (data) {
      this.sendEvent(data, "optionsMenuShown");
    },
    optionSelected: function (data) {
      this.sendEvent(data, "optionSelected");
    },
    eventAdded: function (data) {
      this.sendEvent(data, "eventAdded");
    },

    //filters
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

    //login
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