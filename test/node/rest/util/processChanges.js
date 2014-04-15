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
  ["newParticipants", "editedParticipants"].forEach(function (participantType) {

    describe(participantType, function () {

      before(function (done) {
        var changes = [];
        [1, 2].forEach(function (i) {
          for (var j = 0; j < i; j += 1) {
            var change = {new_values: {}};
            change.new_values[participantType] = [{}];
            ["type", "importance", "thing"].forEach(function (key) {
              change.new_values[participantType][0][key] = {
                id: i
              };
            });
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
});
