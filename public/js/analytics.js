define(["underscore"], function (_) {
  var initialised = false;
  return {
    send: function (data) {
      window.universal_variable.events.push(data);
    }
  };
});