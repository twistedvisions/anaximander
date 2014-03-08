/*global exports*/
/*jslint multistr: true */
// var dbm =
require("db-migrate");
var async = require("async");
// var type = dbm.dataType;

exports.up = function (db, callback) {
  var actions = [
    db.createTable.bind(db, "importance", {
      id:            {type: "int",     primaryKey: true, autoIncrement: true},
      name:          {type: "string",  notNull: false },
      description:   {type: "string",  notNull: false, unique: true },
      value:         {type: "int",  notNull: false },
      type_id:       {type: "int",  notNull: false }
    }),
    db.addColumn.bind(db, "thing_subtype", "importance_id", {
      type: "int",
      notNull: true
    }),
    db.addColumn.bind(db, "event", "importance_id", {
      type: "int",
      notNull: true
    }),
    db.addColumn.bind(db, "event_participant", "importance_id", {
      type: "int",
      notNull: true
    }),
    db.addColumn.bind(db, "type", "default_importance_id", {
      type: "int",
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
    {name: "subjects", typeId: 15},
    {name: "attendees", typeId: 16}
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
    db.dropColumn.bind(db, "event_participant", "importance_id", callback),
    db.dropColumn.bind(db, "event", "importance_id", callback),
    db.dropColumn.bind(db, "thing_subtype", "importance_id", callback),
    db.dropColumn.bind(db, "type", "default_importance_id", callback),
    db.dropTable.bind(db, "importance", callback)
  ], callback);
};