/*global describe, it, before, after */

var _ = require("underscore");
var stubDb = require("../../stubDb");

var processChanges = require("../../../../lib/rest/util/processChanges");

describe("processChanges", function () {
  ["type", "importance", "place", "thing"].forEach(function (key) {
    describe(key, function () {
      before(function (done) {
        var changes = [];
        [1, 2].forEach(function (i) {
          for (var j = 0; j < i; j += 1) {
            var change = {new_values: {}};
            change.new_values[key + "Id"] = i;
            changes.push(change);
          }
        });
        this.changes = changes;
        stubDb.setup(this);
        stubDb.setQueryValues(this, [
          [
            {id: 1, name: "name1"},
            {id: 2, name: "name2"}
          ]
        ]);
        processChanges.processChanges(this.changes).then(_.bind(function (updatedChanges) {
          this.updatedChanges = updatedChanges;
          done();
        }, this));
      });
      after(function () {
        stubDb.restore(this);
      });

      it("should look the ids up from the db", function () {
        this.args[0][1][0].should.eql([1, 2]);
      });
      it("should update the changes object with the name", function () {
        this.updatedChanges[0].new_values[key].should.equal("name1");
        this.updatedChanges[1].new_values[key].should.equal("name2");
        this.updatedChanges[2].new_values[key].should.equal("name2");
      });
    });
  });
  describe("topLevelLookups", function () {
    before(function (done) {
      this.changes = [
        {
          new_values: {
            type_id: 1,
            parent_type_id: 2,
            importance_id: 3,
            default_importance_id: 4,
            place_id: 5
          }
        }
      ];
      stubDb.setup(this);
      stubDb.setQueryValues(this, [
        [
          {id: 1, name: "type-name1"},
          {id: 2, name: "type-name2"}
        ],
        [
          {id: 3, name: "importance-name1"},
          {id: 4, name: "importance-name2"}
        ],
        [
          {id: 5, name: "thing-name1"}
        ]
      ]);
      processChanges.processChanges(this.changes).then(_.bind(function (updatedChanges) {
        this.updatedChanges = updatedChanges;
        done();
      }, this));
    });
    after(function () {
      stubDb.restore(this);
    });
    it("should look the ids up from the db", function () {
      this.args[0][1][0].should.eql([1, 2]);
      this.args[1][1][0].should.eql([3, 4]);
      this.args[2][1][0].should.eql([5]);
    });
    it("should update the changes object with the name", function () {
      this.updatedChanges[0].new_values.type.should.equal("type-name1");
      this.updatedChanges[0].new_values.parent_type.should.equal("type-name2");
      this.updatedChanges[0].new_values.importance.should.equal("importance-name1");
      this.updatedChanges[0].new_values.default_importance.should.equal("importance-name2");
      this.updatedChanges[0].new_values.place.should.equal("thing-name1");
    });
  });
  describe("getParticipantCreationLookups", function () {
    before(function (done) {
      this.changes = [
        {
          new_values: {
            participants: [{
              role_id: 1,
              importance_id: 2,
              thing_id: 3
            }]
          }
        }
      ];
      stubDb.setup(this);
      stubDb.setQueryValues(this, [
        [
          {id: 1, name: "type-name1"}
        ],
        [
          {id: 2, name: "importance-name1"}
        ],
        [
          {id: 3, name: "thing-name1"}
        ]
      ]);
      processChanges.processChanges(this.changes).then(_.bind(function (updatedChanges) {
        this.updatedChanges = updatedChanges;
        done();
      }, this));
    });
    after(function () {
      stubDb.restore(this);
    });
    it("should look the ids up from the db", function () {
      this.args[0][1][0].should.eql([1]);
      this.args[1][1][0].should.eql([2]);
      this.args[2][1][0].should.eql([3]);
    });
    it("should update the changes object with the name", function () {
      this.updatedChanges[0].new_values.participants[0].type.should.equal("type-name1");
      this.updatedChanges[0].new_values.participants[0].importance.should.equal("importance-name1");
      this.updatedChanges[0].new_values.participants[0].thing.should.equal("thing-name1");
    });
  });
  describe("old values", function () {
    before(function (done) {
      this.changes = [
        {
          new_values: {
            type_id: 1
          },
          old_values: {
            type_id: 2
          }
        }
      ];
      stubDb.setup(this);
      stubDb.setQueryValues(this, [
        [
          {id: 1, name: "type-name1"},
          {id: 2, name: "type-name2"}
        ]
      ]);
      processChanges.processChanges(this.changes).then(_.bind(function (updatedChanges) {
        this.updatedChanges = updatedChanges;
        done();
      }, this));
    });
    after(function () {
      stubDb.restore(this);
    });
    it("should look the ids up from the db", function () {
      this.args[0][1][0].should.eql([1, 2]);
    });
    it("should update the changes object with the name", function () {
      this.updatedChanges[0].old_values.type.should.equal("type-name2");
    });
  });
  ["newParticipants", "editedParticipants"].forEach(function (participantType) {

    describe(participantType, function () {

      before(function (done) {
        var changes = [];
        [1, 2].forEach(function (i) {
          for (var j = 0; j < i; j += 1) {
            var change = {new_values: {}};
            change.new_values[participantType] = [{}];
            change.new_values[participantType][0].type = {id: i};
            change.new_values[participantType][0].importance = {id: i};
            change.new_values[participantType][0].thing = {id: i};
            changes.push(change);
          }
        });
        this.changes = changes;
        stubDb.setup(this);
        stubDb.setQueryValues(this, [
          [
            {id: 1, name: "type-name1"},
            {id: 2, name: "type-name2"}
          ],
          [
            {id: 1, name: "importance-name1"},
            {id: 2, name: "importance-name2"}
          ],
          [
            {id: 1, name: "thing-name1"},
            {id: 2, name: "thing-name2"}
          ]
        ]);
        processChanges.processChanges(this.changes).then(_.bind(function (updatedChanges) {
          this.updatedChanges = updatedChanges;
          done();
        }, this));
      });
      after(function () {
        stubDb.restore(this);
      });
      it("should look the ids up from the db", function () {
        this.args[0][1][0].should.eql([1, 2]);
        this.args[1][1][0].should.eql([1, 2]);
        this.args[2][1][0].should.eql([1, 2]);
      });
      it("should update the changes object with the name", function () {
        this.updatedChanges[0].new_values[participantType][0].type.should.equal("type-name1");
        this.updatedChanges[1].new_values[participantType][0].importance.should.equal("importance-name2");
        this.updatedChanges[2].new_values[participantType][0].thing.should.equal("thing-name2");
      });
    });
  });
  describe("removedParticipants", function () {

    before(function (done) {
      var changes = [];
      [1, 2].forEach(function (i) {
        for (var j = 0; j < i; j += 1) {
          var change = {new_values: {}};
          change.new_values.removedParticipants = [i];
          changes.push(change);
        }
      });
      this.changes = changes;
      stubDb.setup(this);
      stubDb.setQueryValues(this, [
        [
          {id: 1, name: "thing-name1"},
          {id: 2, name: "thing-name2"}
        ]
      ]);
      processChanges.processChanges(this.changes).then(_.bind(function (updatedChanges) {
        this.updatedChanges = updatedChanges;
        done();
      }, this));
    });
    after(function () {
      stubDb.restore(this);
    });
    it("should look the ids up from the db", function () {
      this.args[0][1][0].should.eql([1, 2]);
    });
    it("should update the changes object with the name", function () {
      this.updatedChanges[0].new_values.removedParticipants[0].should.equal("thing-name1");
      this.updatedChanges[2].new_values.removedParticipants[0].should.equal("thing-name2");
    });
  });
  describe("newSubtypes", function () {

    before(function (done) {
      this.changes = [
        {
          new_values: {
            subtypes: [{
              type_id: 1,
              importance_id: 2
            }]
          }
        }
      ];
      stubDb.setup(this);
      stubDb.setQueryValues(this, [
        [
          {id: 1, name: "type-name1"}
        ],
        [
          {id: 2, name: "importance-name1"}
        ]
      ]);
      processChanges.processChanges(this.changes).then(_.bind(function (updatedChanges) {
        this.updatedChanges = updatedChanges;
        done();
      }, this));
    });
    after(function () {
      stubDb.restore(this);
    });
    it("should look the ids up from the db", function () {
      this.args[0][0].should.equal("lookup_type_list");
      this.args[1][0].should.equal("lookup_importance_list");
      this.args[0][1][0].should.eql([1]);
      this.args[1][1][0].should.eql([2]);
    });
    it("should update the changes object with the name", function () {
      this.updatedChanges[0].new_values.subtypes[0].type.should.equal("type-name1");
      this.updatedChanges[0].new_values.subtypes[0].importance.should.equal("importance-name1");
    });
  });
  describe("newSubtypes", function () {

    before(function (done) {
      var changes = [];
      [1, 2].forEach(function (i) {
        for (var j = 0; j < i; j += 1) {
          var change = {new_values: {}};
          change.new_values.newSubtypes = [{}];
          change.new_values.newSubtypes[0].type = {id: i};
          change.new_values.newSubtypes[0].importance = {id: i};
          changes.push(change);
        }
      });
      this.changes = changes;
      stubDb.setup(this);
      stubDb.setQueryValues(this, [
        [
          {id: 1, name: "type-name1"},
          {id: 2, name: "type-name2"}
        ],
        [
          {id: 1, name: "importance-name1"},
          {id: 2, name: "importance-name2"}
        ]
      ]);
      processChanges.processChanges(this.changes).then(_.bind(function (updatedChanges) {
        this.updatedChanges = updatedChanges;
        done();
      }, this));
    });
    after(function () {
      stubDb.restore(this);
    });
    it("should look the ids up from the db", function () {
      this.args[0][0].should.equal("lookup_type_list");
      this.args[1][0].should.equal("lookup_importance_list");
      this.args[0][1][0].should.eql([1, 2]);
      this.args[1][1][0].should.eql([1, 2]);
    });
    it("should update the changes object with the name", function () {
      this.updatedChanges[0].new_values.newSubtypes[0].type.should.equal("type-name1");
      this.updatedChanges[1].new_values.newSubtypes[0].importance.should.equal("importance-name2");
    });
  });
  describe("editedSubtypes", function () {
    before(function (done) {
      var changes = [];
      [1, 2].forEach(function (i) {
        for (var j = 0; j < i; j += 1) {
          var change = {new_values: {}};
          change.new_values.editedSubtypes = {};
          change.new_values.editedSubtypes[i] = {id: i};
          changes.push(change);
        }
      });
      this.changes = changes;
      stubDb.setup(this);
      stubDb.setQueryValues(this, [
        [
          {id: 1, name: "type-name1"},
          {id: 2, name: "type-name2"}
        ],
        [
          {id: 1, name: "importance-name1"},
          {id: 2, name: "importance-name2"}
        ]
      ]);
      processChanges.processChanges(this.changes).then(_.bind(function (updatedChanges) {
        this.updatedChanges = updatedChanges;
        done();
      }, this));
    });
    after(function () {
      stubDb.restore(this);
    });
    it("should look the ids up from the db", function () {
      this.args[0][0].should.equal("lookup_type_list");
      this.args[1][0].should.equal("lookup_importance_list");
      this.args[0][1][0].should.eql([1, 2]);
      this.args[1][1][0].should.eql([1, 2]);
    });
    it("should update the changes object with the name", function () {
      this.updatedChanges[0].new_values.editedSubtypes[0].type.should.equal("type-name1");
      this.updatedChanges[1].new_values.editedSubtypes[0].importance.should.equal("importance-name2");
    });
  });
  describe("removedSubtypes", function () {
    before(function (done) {
      var changes = [];
      [1, 2].forEach(function (i) {
        for (var j = 0; j < i; j += 1) {
          var change = {new_values: {}};
          change.new_values.removedSubtypes = [i];
          changes.push(change);
        }
      });
      this.changes = changes;
      stubDb.setup(this);
      stubDb.setQueryValues(this, [
        [
          {id: 1, name: "type-name1"},
          {id: 2, name: "type-name2"}
        ]
      ]);
      processChanges.processChanges(this.changes).then(_.bind(function (updatedChanges) {
        this.updatedChanges = updatedChanges;
        done();
      }, this));
    });
    after(function () {
      stubDb.restore(this);
    });
    it("should look the ids up from the db", function () {
      this.args[0][1][0].should.eql([1, 2]);
    });
    it("should update the changes object with the name", function () {
      this.updatedChanges[0].new_values.removedSubtypes[0].should.equal("type-name1");
      this.updatedChanges[2].new_values.removedSubtypes[0].should.equal("type-name2");
    });
  });
  describe("default importances", function () {
    before(function (done) {
      var changes = [];
      [1, 2].forEach(function (i) {
        for (var j = 0; j < i; j += 1) {
          var change = {new_values: {}};
          change.new_values.defaultImportanceId = [i];
          changes.push(change);
        }
      });
      this.changes = changes;
      stubDb.setup(this);
      stubDb.setQueryValues(this, [
        [
          {id: 1, name: "importance-name1"},
          {id: 2, name: "importance-name2"}
        ]
      ]);
      processChanges.processChanges(this.changes).then(_.bind(function (updatedChanges) {
        this.updatedChanges = updatedChanges;
        done();
      }, this));
    });
    after(function () {
      stubDb.restore(this);
    });
    it("should look the ids up from the db", function () {
      this.args[0][1][0].should.eql([1, 2]);
    });
    it("should update the changes object with the name", function () {
      this.updatedChanges[0].new_values.defaultImportance.should.equal("importance-name1");
      this.updatedChanges[2].new_values.defaultImportance.should.equal("importance-name2");
    });
  });
});
