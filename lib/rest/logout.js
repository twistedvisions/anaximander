module.exports = {
  init: function (app) {
    app.post("/logout", this.logoutHandler);
  },
  logoutHandler: function (req, res) {
    var user = req.user;
    req.logout();
    res.send(user);
  }
};