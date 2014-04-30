/*global describe, it, beforeEach, sinon */
define(

  ["chai", "underscore", "backbone", "when", "moment",
    "models/thing"],

  function (chai, _, Backbone, when, moment, Thing) {

    var should = chai.should();

    describe("thing model", function () {
      describe("parse", function () {
        it("should rename type_id to typeId", function () {
          this.thing = new Thing();
          this.thing.parse({
            type_id: 3
          }).typeId.should.equal(3);
        });
      });

      describe("differences", function () {

        describe("last_edit time", function () {

          beforeEach(function () {
            this.thing = new Thing();
            sinon.stub(this.thing, "getDifferences", _.bind(function () {
              return this.differences;
            }, this));
            sinon.stub(this.thing, "sendChangeRequest", _.bind(function () {
              if (this.shouldSucceed) {
                return when.resolve();
              } else {
                return when.reject();
              }
            }, this));
          });

          it("should contain the last_edit time in the differences", function (done) {
            this.differences = {
              name: "new name"
            };
            var time = new Date();
            this.thing.set("last_edited", time);
            this.thing.update();
            _.defer(
              _.bind(function () {
                var ex;
                try {
                  this.thing.sendChangeRequest.args[0][0].last_edited.should.eql(time);
                } catch (e) {
                  ex = e;
                }
                done(ex);
              }, this)
            );
          });
        });

        describe("individual values", function () {
          beforeEach(function () {
            this.oldValues = {
              id: 123,
              name: "existing event name",
              link: "//www.link.com",
              typeId: 6,
              subtypes: [
                {
                  type: {id: 2},
                  importance: {id: 20}
                },
                {
                  type: {id: 3},
                  importance: {id: 30}
                }
              ]
            };
            this.newValues = JSON.parse(JSON.stringify(this.oldValues));

            this.thing = new Thing(this.oldValues, {parse: true});
          });

          it("should always have an id", function () {
            this.newValues.name = "something different";
            var differences = this.thing.getDifferences(this.newValues);
            differences.id.should.equal(123);
          });
          it("should send the name if it has changed", function () {
            this.newValues.name = "something different";
            var differences = this.thing.getDifferences(this.newValues);
            differences.name.should.equal("something different");
          });
          it("should send the link if it has changed", function () {
            this.newValues.link = "//www.someotherlink.com";
            var differences = this.thing.getDifferences(this.newValues);
            differences.link.should.equal("//www.someotherlink.com");
          });

          it("should send the typeId if it has changed", function () {
            this.newValues.typeId = 7;
            var differences = this.thing.getDifferences(this.newValues);
            differences.typeId.should.equal(7);
          });

          it("should send new subtypes", function () {
            this.newValues.subtypes = [{
              type: {id: 8},
              importance: {id: 80}
            }];
            var differences = this.thing.getDifferences(this.newValues);
            differences.newSubtypes[0].type.id.should.equal(8);
            differences.newSubtypes[0].importance.id.should.equal(80);
          });
          it("should send new and changed subtypes together", function () {
            this.newValues.subtypes = [
              {
                type: {id: 8},
                importance: {id: 80}
              },
              {
                type: {id: 2},
                importance: {id: 21}
              },
              {
                type: {id: 3},
                importance: {id: 30}
              }
            ];
            var differences = this.thing.getDifferences(this.newValues);
            differences.newSubtypes.length.should.equal(1);
            _.keys(differences.editedSubtypes).length.should.equal(1);
          });
          it("should send removed subtypes", function () {
            this.newValues.subtypes = [
              {
                type: {id: 2},
                importance: {id: 20}
              }
            ];
            var differences = this.thing.getDifferences(this.newValues);
            differences.removedSubtypes.should.eql([3]);
          });
          it("should send multiple removed subtypes", function () {
            this.newValues.subtypes = [];
            var differences = this.thing.getDifferences(this.newValues);
            differences.removedSubtypes.should.eql([2, 3]);
          });
          it("should send subtypes with changed existing importance", function () {
            this.newValues.subtypes = [
              {
                type: {id: 2},
                importance: {id: 21}
              },
              {
                type: {id: 3},
                importance: {id: 30}
              }
            ];
            var differences = this.thing.getDifferences(this.newValues);

            _.keys(differences.editedSubtypes).length.should.equal(1);
            _.keys(differences.editedSubtypes)[0].should.equal("2");
            differences.editedSubtypes[2].id.should.equal(21);
          });
          it("should send participants with changed new importance", function () {
            this.newValues.subtypes = [
              {
                type: {id: 2},
                importance: {id: -1, name: "new importance name"}
              },
              {
                type: {id: 3},
                importance: {id: 30}
              }
            ];
            var differences = this.thing.getDifferences(this.newValues);

            _.keys(differences.editedSubtypes).length.should.equal(1);
            _.keys(differences.editedSubtypes)[0].should.equal("2");
            differences.editedSubtypes[2].id.should.be.lessThan(0);
            differences.editedSubtypes[2].name.should.equal("new importance name");
          });
          it("should not remove elements from subtypes", function () {
            var values = {
              subtypes: [{type: {id: 1234}}]
            };
            this.thing.getDifferences(values);
            values.subtypes.length.should.equal(1);
          });
          it("should not send empty newSubtypes", function () {
            var values = {
            };
            should.not.exist(this.thing.getDifferences(values).newSubtypes);
          });
          it("should not send empty removedSubtypes", function () {
            var values = {
              subtypes: [{type: {id: 2}}, {type: {id: 3}}]
            };
            should.not.exist(this.thing.getDifferences(values).removedSubtypes);
          });
        });
      });

      describe("raw differences", function () {
        it("should return one difference if the name has changed", function () {
          this.thing = new Thing();
          var differences = this.thing.getRawDifferences(
            {name: "old name", start_date: moment(0), end_date: moment(0)},
            {name: "new name", start_date: moment(0), end_date: moment(0)}
          );
          differences.length.should.equal(1);
        });
      });
      describe("update", function () {
        beforeEach(function () {
          this.thing = new Thing();
          sinon.stub(this.thing, "getDifferences", function () {
            return {
              name: "something"
            };
          });
          sinon.stub(this.thing, "sendChangeRequest");
        });
        it("should send a reason", function () {
          this.thing.update({}, "the reason");
          this.thing.sendChangeRequest.getCall(0).args[0].reason.should.equal("the reason");
        });
      });
    });
  }
);