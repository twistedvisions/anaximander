/*global exports*/

require("db-migrate");
var async = require("async");

exports.up = function (db, callback) {
  var actions = [];

  actions.push(db.addColumn.bind(db, "type", "related_type_id", {
    type: "bigint",
    notNull: false
  }));

  actions.push(db.all.bind(db, "ALTER TABLE type " +
    "ADD CONSTRAINT related_type_id_fkey FOREIGN KEY (related_type_id) " +
    "REFERENCES type (id);"));

  var typeMap = [
    {id: 15, related_type_id: 5},
    {id: 16, related_type_id: 6},
    {id: 21, related_type_id: 7},
    {id: 22, related_type_id: 8},
    {id: 23, related_type_id: 9},
    {id: 24, related_type_id: 10},
    {id: 25, related_type_id: 11},
    {id: 26, related_type_id: 12},
    {id: 27, related_type_id: 13},
    {id: 28, related_type_id: 14}
  ];

  typeMap.forEach(function (type) {
    actions.push(db.all.bind(db, "UPDATE type " +
      "SET related_type_id = " + type.related_type_id + " " +
      "WHERE id = " + type.id + ";"));
  });

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  var actions = [];
  actions.push(db.removeColumn.bind(db, "type", "related_type_id"));
  async.series(actions, callback);
};
