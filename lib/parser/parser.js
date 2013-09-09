/*global process, console*/

var kue = require("kue"),
    cluster = require("cluster");

var when = require("when"),
    _ = require("underscore"),
    humanize = require("humanize"),

    nconf = require("../config"),
    processFile = require("./processFile"),
    addPlaces = require("./writers/addPlaces"),
    processEvents = require("./writers/processEvents");

var jobs = kue.createQueue();

var concurrency = 4;

var getJobCount = function (type) {
  var d = when.defer();
  jobs[type + "Count"](function (err, count) {
    d.resolve(count);
  });
  return d.promise;
};

var checkJobsProcessed = function (minQueuedJobs, waitForActive) {
  if (!minQueuedJobs) {
    minQueuedJobs = 1e20;
  }
  var d = when.defer();
  var last = -1;
  var time = 10 * 1000;
  var _checkJobsProcessed = function () {
    var waits = [getJobCount("inactive")];
    if (waitForActive) {
      waits.push(getJobCount("active"));
    }
    when.all(waits).then(function (counts) {
      var count = _.reduce(counts, function (a, b) { return a + b; });
      console.log(counts, count);
      if ((count === 0) || ((count === last) && (count < minQueuedJobs))) {
        d.resolve();
      } else {
        last = count;
        setTimeout(_checkJobsProcessed, time);
      }
    });
  };
  setTimeout(_checkJobsProcessed, time);
  return d.promise;
};

if (cluster.isMaster) {

  var n = Math.floor(20516861 / 2);
  // n = 0;

  var clustersToRun = 4;
  var clustersClosed = 0;

  var file = nconf.parser.data_file;

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

  var workers = _.times(clustersToRun, function () {
    return cluster.fork();
  });

  cluster.on("exit", function (worker/*, code, signal*/) {
    console.log("worker " + worker.process.pid + " died");

    clustersClosed += 1;
    if (clustersClosed === clustersToRun) {
      process.exit(0);
    }
  });

  checkJobsProcessed().then(function () {
    _.each(workers, function (worker) {
      worker.send("process_events");
    });
    console.log("processing events!");
    checkJobsProcessed(1000, true).then(function () {
      _.each(workers, function (worker) {
        worker.send("die");
      });
      console.log("killing workers!");
    });
  });
} else {

  jobs.process("process_place", concurrency, function (job, done) {
    addPlaces(job).then(function () {
      job.log("done");
      done();
    });
  });

  var _processEvents = function () {
    jobs.process("process_event", concurrency, function (job, done) {
      processEvents(job).then(function () {
        job.log("done");
        done();
      });
    });
  };


  process.on("message", function (message) {
    if (message === "process_events") {
      _processEvents();
    }
    if (message === "die") {
      process.exit(0);
    }
  });

}