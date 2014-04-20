var sinon = require("sinon");
var when = require("when");

var acquireLock = require("../../../lib/parser/acquireLock");

sinon.stub(acquireLock, "start");
sinon.stub(acquireLock, "acquireLock", function () {
  return when.resolve();
});
