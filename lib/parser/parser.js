/*global process, console*/

var kue = require("kue"),
    cluster = require("cluster");

var when = require("when"),
    sequence = require("when/sequence"),
    _ = require("underscore"),
    fs = require("fs"),
    humanize = require("humanize"),

    processFile = require("./processFile"),
    addPlaces = require("./writers/addPlaces"),
    addPeople = require("./writers/addPeople");

var jobs = kue.createQueue();


var concurrency = 10;

var checkJobsProcessed = function () {
  var d = when.defer();
  var last = -1;
  var _checkJobsProcessed = function (done) {
    jobs.inactiveCount(function (err, count) {
      if ((count === 0) || (count === last)) {
        d.resolve();
      } else {
        last = count;
        setTimeout(_.bind(_checkJobsProcessed, this, done), 1000);
      }
    });
  };
  _checkJobsProcessed();
  return d.promise;
};

if (cluster.isMaster) {

  var n = Math.floor(20516861 / 1000);

  var file = require("./config").data_file;

  console.log("reading at most", humanize.numberFormat(n, 0));

  kue.app.listen(3000);

  processFile(file, n);

  for (var i = 0; i < 4; i += 1) {
    cluster.fork();
  }

  cluster.on("exit", function (worker, code, signal) {
    console.log("worker " + worker.process.pid + " died");
  });

} else {

  jobs.process("process_place", concurrency, function (job, done) {
    addPlaces(job).then(function () {
      job.log("done");
      done();
    });
  });

  checkJobsProcessed().then(function () {
    console.log("processing people!");
    jobs.process("process_person", concurrency, function (job, done) {
      addPeople(job).then(function () {
        job.log("done");
        done();
      });
    });
    return checkJobsProcessed();
  });

}