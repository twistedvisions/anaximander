/* jshint node: true */

module.exports = function (grunt) {
  "use strict";

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    jshint: {
      all: [
        "Gruntfile.js",
        "lib/**/*.js",
        "public/js/**/*.js",
        "test/**/*.js"
      ],
      options: {
        jshintrc: ".jshintrc",
        ignores: "public/js/libs/**/*.js"
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-jshint");

  grunt.registerTask("test", ["jshint"]);
  grunt.registerTask("default", ["test"]);
};