define(["underscore"], function (_) {
  var initialised = false;
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
    navigation: function (data) {
      this.ensureUniversalVariable();
      data = this.ensureData(data, "navigation");
      window.universal_variable.events.push(data);
    },
    infoBoxShown: function (data) {
      this.ensureUniversalVariable();
      data = this.ensureData(data, "infoBoxShown");
      window.universal_variable.events.push(data);
    },
    linkClicked: function (data) {
      this.ensureUniversalVariable();
      data = this.ensureData(data, "linkClicked");
      window.universal_variable.events.push(data);
    }
  };
});