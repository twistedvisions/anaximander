define(["underscore"], function (_) {
  var initialised = false;
  return {
    ensureData: function (data, type) {
      if (!data) {
        data = {};
      }
      data.type = type;
      return data;
    },
    navigation: function (data) {
      data = this.ensureData(data, "navigation");
      window.universal_variable.events.push(data);
    },
    infoBoxShown: function (data) {
      data = this.ensureData(data, "infoBoxShown");
      window.universal_variable.events.push(data);
    },
    linkClicked: function (data) {
      data = this.ensureData(data, "linkClicked");
      window.universal_variable.events.push(data);
    }
  };
});