module.exports = function (code, done) {
  return function () {
    var ex;
    try {
      code.apply(this, arguments);
    } catch (e) {
      ex = e;
    } finally {
      done(ex);
    }
  };
};