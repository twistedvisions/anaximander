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
    },
    bower: {
      install: {
        options: {
          targetDir: "public/js/libs/bower",
          layout: "byType"
        }
         //just run 'grunt bower:install' and you'll see files from your Bower packages in lib directory
      }
    },
    requirejs: {
      compile: {
        options: {
          // "appDir": "public/js",
          // "baseUrl": ".",
          // "dir": "out",
          // name: "anax",
          mainConfigFile: "main.build.js",
          // name: "path/to/almond", // assumes a production build using almond
          // out: "public/anax.js",

          "appDir": "public/js",
          "baseUrl": ".",
          "dir": "public/js-prod",
          "siteRoot": "../css",
          "modules": [
            {
              name: "socketio"
            },
            {
              // "separateCSS": true,
              "name": "anax",
              "insertRequire": ["anax"]
              // ,
              // "exclude": [
              //   "../socket.io/socket.io",
              //   "socket.io/socket.io",
              //   "socketio",
              //   "/home/pretzel/projects/anaximander/public/socket.io/socket.io.js"
              // ]
              // "exclude": ["css/normalize"]
            }
          ],
          findNestedDependencies: true,
          "map": {
            "*": {
              "css": "libs/bower/require-css/css"
            },
            "when": {
              "./lib/": "libs/bower/when/when/lib"
            }
          },
          "cssDir": "../",
          "paths": {
            "backbone": "./libs/bower/backbone/backbone",
            "bootstrap": "./libs/bower/bootstrap/bootstrap",
            "chroma": "./libs/bower/chroma-js/chroma",
            "cookies": "./libs/bower/cookies-js/cookies",
            "datetimepicker": "./libs/bower/jqueryui-timepicker-addon/src/jquery-ui-timepicker-addon",
            "deep-diff": "./libs/bower/deep-diff/index",
            "jquery": "./libs/bower/jquery/jquery",
            "jqueryui": "./libs/bower/jquery-ui/jquery-ui",
            "moment": "./libs/bower/momentjs/moment",
            "numeral": "./libs/bower/numeral/numeral",
            "parsley": "libs/bower/parsleyjs/parsley",
            "select2": "./libs/bower/select2/select2",
            "sha256": "./libs/bower/cryptojslib/sha256",
            "text": "./libs/bower/requirejs-text/text",
            "underscore": "./libs/bower/lodash/lodash.compat",
            "underscore_string": "./libs/bower/underscore.string/lib/underscore.string",

            "when": "./libs/bower/when/when",

            "templates": "../templates",
            "async": "./libs/async",
            "fuse": "./libs/fuse",
            "range-slider": "libs/jQAllRangeSliders-min",
            "socketio": "./libs/bower/socket.io-client/dist/socket.io",
            // "socketio": "../socket.io/socket.io",
            "styled_marker": "./libs/styled_marker"
          }
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-bower-task");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-requirejs");

  grunt.registerTask("test", ["jshint", "less"]);
  grunt.registerTask("build", ["bower", "requirejs", "less"]);
  grunt.registerTask("default", ["test", "build"]);
};