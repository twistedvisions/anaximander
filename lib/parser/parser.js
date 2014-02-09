/*global process*/

var kue = require("kue"),
    cluster = require("cluster"),
    sh = require("execSync");

var when = require("when"),
    _ = require("underscore"),
    argv = require("optimist").argv,
    db = require("./raw_db"),
    winston = require("winston"),

    nconf = require("../config"),
    processFile = require("./processFile"),
    addPlaces = require("./writers/addPlaces"),
    processEvents = require("./writers/processEvents");

var jobs = kue.createQueue();

var concurrency = 2;

var startReadingPc = argv.start;
var finishReadingPc = argv.finish;
var doPlaces = !!argv.p;
var doEvents = !!argv.e;
var fileName = argv.f;

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  "level": "info",
  "timestamp": true,
  "colorize": true
});

var getJobCount = function (type) {
  var d = when.defer();
  jobs[type + "Count"](function (err, count) {
    d.resolve(count);
  });
  return d.promise;
};

var getLineCount = function (file) {
  var result = sh.exec("wc -l " + file);
  return parseInt(result.stdout.split(" ")[0], 10);
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
      winston.info("jobs processing:", counts);
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

  var clustersToRun = 4;
  var clustersClosed = 0;

  var file = fileName || nconf.parser.data_file;

  jobs.on("job complete", function (id) {
    kue.Job.get(id, function (err, job) {
      if (!err) {
        if (job) {
          setTimeout(function () {
            job.remove();
          }, 30 * 1000);
        }
      } else {
        winston.error("problem getting job",
          {message: err.message, stack: err.stack});
      }
    });
  });

  kue.app.listen(3000);
  var lineCount = getLineCount(file);
  var fileProcessed = processFile(file, lineCount,
    startReadingPc, finishReadingPc,
    doPlaces, doEvents);

  var workers = _.times(clustersToRun, function () {
    return cluster.fork();
  });

  cluster.on("exit", function (worker/*, code, signal*/) {
    winston.info("worker " + worker.process.pid + " died");

    clustersClosed += 1;
    if (clustersClosed === clustersToRun) {
      process.exit(0);
    }
  });
  var killWorkers = function () {
    _.each(workers, function (worker) {
      worker.send("die");
    });
    winston.info("killing workers!");
  };

  fileProcessed.then(function () {
    if (doEvents) {
      _.each(workers, function (worker) {
        worker.send("process_events");
      });
      winston.info("processing events!");
      checkJobsProcessed(1000, true).then(function () {
        killWorkers();
      });
    } else {
      checkJobsProcessed().then(killWorkers);
    }
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
      db.end();
      process.exit(0);
    }
  });

}