// Karma configuration
// Generated on Sun Aug 25 2013 22:45:14 GMT+0100 (BST)

module.exports = function (config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: ".",


    // frameworks to use
    frameworks: ["mocha", "requirejs", "chai", "sinon-chai"],


    // list of files / patterns to load in the browser
    files: [
      "test/test-main.js",
      {pattern: "test/webapp/**/*.js", included: false},
      {pattern: "public/js/**/*.js", included: false},
      {pattern: "public/js/libs/bower/**/*.less", included: false},
      {pattern: "public/js/libs/bower/**/*.css", included: false},
      {pattern: "public/css/**/*.less", included: false},
      {pattern: "public/templates/**/*.htm*", included: false, served: true},
      {pattern: "node_modules/socket.io-client/dist/*.js", included: false, served: true}
    ],


    // list of files to exclude
    exclude: [

    ],


    // test results reporter to use
    // possible values: "dots", "progress", "junit", "growl", "coverage"
    reporters: ["progress"],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ["Chrome"],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false


  });
};