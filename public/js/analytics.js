define(["underscore"], function (_) {
  var analytics = {
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
    _addEvent: function (eventName) {
      this[eventName] = _.bind(function (eventName, data) {
        this.sendEvent(data, eventName);
      }, this, eventName);
    }
  };
  var events = [
    //map
    "navigation",
    "infoBoxShown",
    "linkClicked",
    "mapEntrySearched",
    "mapEntryEdited",

    //search
    "searchBoxCharacterTyped",
    "searchBoxStringTyped",
    "searchBoxCleared",
    "searchEntryLinkClicked",
    "searchEntryClicked",
    "hideSearchResults",
    "searchSubmitted",
    "searchPasted",
    "searchCopied",
    "searchEntryEdited",

    //period selector
    "periodSelectorOpened",
    "periodSelected",

    //adding events
    "optionsMenuShown",
    "optionSelected",
    "eventAdded",
    "eventSaved",
    "participantAdded",
    "participantRemoved",
    "newTypeAdded",
    "newImportanceAdded",
    "eventSaveClicked",
    "eventSaveValidationFailed",

    //editing things
    "thingSaveClicked",
    "thingSaved",

    //editing types
    "typeListing_showTypes",
    "typeListing_showImportances",
    "typeListing_hideImportances",
    "typeListing_typeEdited",
    "typeListing_typeSaved",
    "typeListing_importanceEdited",
    "typeListing_importanceSaved",

    //thing smmary
    "thingSummary_scroll",

    //filters
    "showFilters",
    "selectPrimary",
    "unselectPrimary",
    "filterEventsByPrimary",
    "filterEventsBySecondary",
    "filterSecondaryFilters",
    "toggleSecondaryFilterSelection",

    //login
    "loginChoiceShown",
    "loginAttempted",
    "loginSucceeded",
    "loginFailed",
    "logout",
    "register",

    //recent changes
    "recentChangesViewed"
  ];
  _.each(events, function (event) {
    analytics._addEvent(event);
  });
  return analytics;
});