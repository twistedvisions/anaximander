/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [
    db.all.bind(db, "CREATE INDEX idx_creator_date ON creator USING btree(date);"),
    db.all.bind(db, "ALTER TABLE creator CLUSTER ON idx_creator_date;")
  ];

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [
    db.all.bind(db, "DROP INDEX idx_creator_date;")
  ];

  async.series(actions, callback);
};
