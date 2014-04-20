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
    },
    less: {
      options: {
        paths: ["public/css"],
        cleancss: true
      },
      src: {
        expand: true,
        cwd:    "public/css",
        src:    "*.less",
        dest:    "public/css",
        ext:    ".css"
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-less");

  grunt.registerTask("test", ["jshint", "less"]);
  grunt.registerTask("default", ["test"]);
};