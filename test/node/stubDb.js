var sinon = require("sinon");
var when = require("when");
var _ = require("underscore");
var db = require("../../lib/db");

var stubbedQuery = function () {
  var d = when.defer();
  this.d.push(d);
  this.args.push(arguments);
  return d.promise;
};

var transactionStub = function (result) {
  return function () {
    var d = when.defer();
    d.resolve(result);
    return d.promise;
  };
};

module.exports = {
  setup: function (self) {
    self.d = [];
    self.args = [];
    self.db = db;

    sinon.stub(db, "runQuery", _.bind(stubbedQuery, self));
    sinon.stub(db, "runQueryInTransaction", _.bind(stubbedQuery, self));

    sinon.stub(db, "startTransaction", transactionStub({}));
    sinon.stub(db, "endTransaction", transactionStub());
    sinon.stub(db, "rollbackTransaction", transactionStub());
  },
  restore: function (self) {
    db.runQuery.restore();
    db.runQueryInTransaction.restore();
    db.startTransaction.restore();
    db.endTransaction.restore();
    db.rollbackTransaction.restore();
    if (self && self.__timeout) {
      clearInterval(self.__timeout);
    }

  },
  setQueryValues: function (self, values) {
    var lastResolved = 0;
    var i = setInterval(function () {
      var value;
      while ((lastResolved < self.d.length) && (lastResolved < values.length)) {
        value = values[lastResolved];
        if (value["throw"]) {
          self.d[lastResolved].reject(value["throw"]);  
        } else {
          self.d[lastResolved].resolve({rows: value});  
        }
        lastResolved += 1;
      }
      if (lastResolved.length >= values.length) {
        clearInterval(self.__timeout);
      }
    }, 1);
    self.__timeout = i;
  }
};
