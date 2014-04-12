var when = require("when");
var redis = require("redis");
var lock = require("redis-lock");

module.exports = {
  start: function () {
    this.client = redis.createClient();
    this.lock = lock(this.client);
  },
  acquireLock: function (key) {
    var d = when.defer();
    this.lock(key, function (done) {
      d.resolve(done);
    });
    return d.promise;
  }
};