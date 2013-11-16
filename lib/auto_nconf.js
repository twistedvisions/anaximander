/*global process*/

var nconf = require("nconf");
var _ = require("underscore");
var path = require("path");
var fs = require("fs");

function isRunningAsTestSuite() {
  // if "main" isn"t the application itself, we"re usually inside a test runner
  // return require.main && (require.main.filename != path.resolve(exports.main));
  return false;
}

function detectEnvironment() {
  // if supplied with an environment, simply use that
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  // Otherwise, try to infer environment from invocation method
  if (isRunningAsTestSuite()) {
    return "test";
  } else {
    return "development";
  }
}

function getLoadPaths(type, configDir) {
  var paths = {};
  // "eg config/settings.defaults.json"
  paths.defaults = path.join(configDir, type + ".defaults.json");
  // "eg" ./settings.json
  paths.overrides = path.join(process.cwd(), type + ".json");
  var loadPaths = [paths.defaults];
  if (fs.existsSync(paths.overrides)) {
    loadPaths.push(paths.overrides);
  }
  return loadPaths;
}

function getConfiguration(type, currentEnvironment) {
  var config = nconf.stores[type];
  var defaults = config.get("defaults");
  var environmentOverrides = config.get(currentEnvironment);
  _.extend(defaults, environmentOverrides);
  return defaults;
}

function createConfiguration(type, configDir) {
  nconf.add(type, {
    type: "memory",
    loadFrom: getLoadPaths(type, configDir)
  });
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = detectEnvironment();
  }
  return getConfiguration(type, process.env.NODE_ENV);
}

module.exports = {
  createConfiguration: createConfiguration,
  detectEnvironment: detectEnvironment
};