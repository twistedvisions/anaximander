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
    processEvents = require("./writers/processEvents");

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

  var n = Math.floor(20516861 / 10);
  // n = 0;

  var clustersToRun = 4;
  var clustersClosed = 0;

  var file = require("./config").data_file;

  if (!n) {
    console.log("reading all lines");
  } else {
    console.log("reading at most", humanize.numberFormat(n, 0));
  }

  jobs.on("job complete", function (id) {
    kue.Job.get(id, function (err, job) {
      if (!err) {
        if (job) {
          setTimeout(function () {

            job.remove();
          }, 30 * 1000);
        }
      } else {
        console.log(err);
      }
    });
  });

  kue.app.listen(3000);

  processFile(file, n);

  _.times(clustersToRun, function () {
    cluster.fork();
  });

  cluster.on("exit", function (worker, code, signal) {
    console.log("worker " + worker.process.pid + " died");

    clustersClosed += 1;
    if (clustersClosed === clustersToRun) {
      process.exit(0);
    }
  });
} else {

  jobs.process("process_place", concurrency, function (job, done) {
    addPlaces(job).then(function () {
      job.log("done");
      done();
    });
  });

  checkJobsProcessed().then(function () {
    console.log("processing events!");
    jobs.process("process_event", concurrency, function (job, done) {
      processEvents(job).then(function () {
        job.log("done");
        done();
      });
    });
    checkJobsProcessed().then(function () {
      process.exit(0);
    });
  });

}