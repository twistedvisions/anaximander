/*global describe, it, before, after */

var _ = require("underscore");
var stubDb = require("../../stubDb");

var processChanges = require("../../../../lib/rest/util/processChanges");

describe.only("processChanges", function () {
  ["type", "importance", "place"].forEach(function (key) {
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
});