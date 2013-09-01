define(["underscore"], function (_) {
  var initialised = false;
  return {
    ensureData: function (data, type) {
      if (!data) {
        data = {};
      }
      data.type = type;
    },
    navigation: function (data) {
      this.ensureData("navigation");
      window.universal_variable.events.push(data);
    },
    infoBoxShown: function (data) {
      this.ensureData("infoBoxShown");
      window.universal_variable.events.push(data);
    },
    linkClicked: function (data) {
      this.ensureData("linkClicked");
      window.universal_variable.events.push(data);
    }
  };
});