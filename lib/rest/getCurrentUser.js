module.exports = {
  init: function (app) {
    app.get("/current-user", function (req, res) {
      res.send({
        "logged-in": req.isAuthenticated()
      });
    });
  }
};