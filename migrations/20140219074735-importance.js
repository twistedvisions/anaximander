/*global exports*/
/*jslint multistr: true */
// var dbm =
require("db-migrate");
var async = require("async");
// var type = dbm.dataType;

exports.up = function (db, callback) {
  var actions = [
    db.createTable.bind(db, "importance", {
      id:            {type: "bigint",  primaryKey: true, autoIncrement: true},
      name:          {type: "string",  notNull: false },
      description:   {type: "string",  notNull: false, unique: true },
      value:         {type: "int",     notNull: false },
      type_id:       {type: "bigint",  notNull: false }
    }),
    db.addColumn.bind(db, "thing_subtype", "importance_id", {
      type: "int",
      notNull: true
    }),
    db.addColumn.bind(db, "event", "importance_id", {
      type: "bigint",
      notNull: true
    }),
    db.addColumn.bind(db, "event_participant", "importance_id", {
      type: "bigint",
      notNull: true
    }),
    db.addColumn.bind(db, "type", "default_importance_id", {
      type: "bigint",
      notNull: false
    }),

    db.all.bind(db, "ALTER TABLE thing_subtype \
      ADD CONSTRAINT importance_fkey FOREIGN KEY (importance_id) \
      REFERENCES importance (id) MATCH FULL;"),
    db.all.bind(db, "ALTER TABLE event \
      ADD CONSTRAINT importance_fkey FOREIGN KEY (importance_id) \
      REFERENCES importance (id) MATCH FULL;"),
    db.all.bind(db, "ALTER TABLE event_participant \
      ADD CONSTRAINT importance_fkey FOREIGN KEY (importance_id) \
      REFERENCES importance (id) MATCH FULL;"),

    db.addIndex.bind(db, "importance", "unique_name_per_type", ["name", "type_id"], true)
  ];

  var defaultImportances = [
    {name: "battles", typeId: 5},
    {name: "births", typeId: 6},
    {name: "constructions closing", typeId: 7},
    {name: "constructions commencement", typeId: 8},
    {name: "constructions opening", typeId: 9},
    {name: "deaths", typeId: 10},
    {name: "organisations going extinct", typeId: 11},
    {name: "organisations' foundation", typeId: 12},
    {name: "places' dissolutions", typeId: 13},
    {name: "places' foundations", typeId: 14},
    {name: "battle sites", typeId: 15},
    {name: "babies", typeId: 16},
    {name: "defunct constructions", typeId: 21},
    {name: "construction sites", typeId: 22},
    {name: "new constructions", typeId: 23},
    {name: "dead people", typeId: 24},
    {name: "defunct organisations", typeId: 25},
    {name: "new organisations", typeId: 26},
    {name: "defunct places", typeId: 27},
    {name: "new places", typeId: 28}
  ];
  var counter = 0;
  defaultImportances.forEach(function (defaultImportance) {
    counter += 1;
    actions.push(db.insert.bind(db, "importance", ["name", "description", "type_id", "value"], [
      "nominal",
      "a default value of importance for " + defaultImportance.name,
      defaultImportance.typeId,
      5
    ]));
    actions.push(db.all.bind(db, "UPDATE type \
      SET default_importance_id = " + counter + " \
      WHERE id = " + defaultImportance.typeId + ";"));
  });

  async.series(actions, callback);
};

exports.down = function (db, callback) {
  async.series([
    db.removeColumn.bind(db, "event_participant", "importance_id", callback),
    db.removeColumn.bind(db, "event", "importance_id", callback),
    db.removeColumn.bind(db, "thing_subtype", "importance_id", callback),
    db.removeColumn.bind(db, "type", "default_importance_id", callback),
    db.dropTable.bind(db, "importance", callback)
  ], callback);
};
