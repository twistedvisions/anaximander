var when = require("when");
var redis = require("redis");
var client = redis.createClient();
var lock = require("redis-lock")(client);

var acquireLock = function (key) {
  var d = when.defer();
  lock(key, function (done) {
    d.resolve(done);
  });
  return d.promise;
};

module.exports = acquireLock;