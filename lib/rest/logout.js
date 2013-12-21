module.exports = {
  init: function (app) {
    app.post("/logout", this.logoutHandler);
  },
  logoutHandler: function (req, res) {
    req.logout();
    res.send("ok");
  }
};