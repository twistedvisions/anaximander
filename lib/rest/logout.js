module.exports = {
  init: function (app) {
    app.post("/logout", function (req, res) {
      req.logout();
      res.send("ok");
    });
  }
};