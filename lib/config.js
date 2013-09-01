/*global __dirname */
var auto_nconf = require("./auto_nconf");

var settings = auto_nconf.createConfiguration("config", __dirname + "/../config");

module.exports = settings;