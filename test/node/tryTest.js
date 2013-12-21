module.exports = function (code, done, onlyCallDoneOnFail) {
  return function () {
    var ex;
    try {
      code.apply(this, arguments);
    } catch (e) {
      ex = e;
    } finally {
      if (!onlyCallDoneOnFail || ex) {
        done(ex);
      }
    }
  };
};