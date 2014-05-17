/* jshint node: true */
var path = require("path");
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
    bower: {
      install: {
        options: {
          targetDir: "public/js/libs/bower",

          layout: function (type, component) {
            var renamedType = type;

            if (type.indexOf("smoothness") >= 0) {
              return type;
            }
            if (type === "__untyped__") {
              return component;
            }
            if (type.indexOf(component) === 0) {
              return path.join(component, type.substring(component.length + 1));
            }
            return path.join(component, renamedType);
          }
        }
      }
    },
    requirejs: {
      compile: {
        options: {
          appDir: "public/js/",
          baseUrl: "./",
          dir: "public/js-prod",
          siteRoot: "../",
          shim: {
            "deep-diff": {
              exports: "DeepDiff"
            }
          },
          modules: [
            {
              "name": "anax",
              "insertRequire": ["anax"]
            },
            {
              "name": "type_listing",
              "insertRequire": ["type_listing"]
            },
            {
              "name": "recent_changes",
              "insertRequire": ["recent_changes"]
            }
          ],
          findNestedDependencies: true,
          map: {
            "*": {
              "less": "libs/bower/require-less/less"
            },
            "when": {
              "./lib/": "libs/bower/when/when/lib"
            }
          },
          skipDirOptimize: true,
          cssDir: "../",

          optimize: "uglify2",
          preserveLicenseComments: false,
          generateSourceMaps: true,
          uglify2: {
            output: {
              beautify: false
            },
            compress: {
              sequences: false
            },
            mangle: true
          },

          paths: {
            "css": "./css",

            "async": "./libs/bower/requirejs-plugins/async",
            "backbone": "./libs/bower/backbone/backbone",
            "bootstrap": "./libs/bower/bootstrap/bootstrap",
            "chroma": "./libs/bower/chroma-js/chroma",
            "cookies": "./libs/bower/cookies-js/cookies",
            "datetimepicker": "./libs/bower/jqueryui-timepicker-addon/src/jquery-ui-timepicker-addon",
            "deep-diff": "./libs/bower/deep-diff/index",
            "jquery": "./libs/bower/jquery/jquery",
            "jqueryui": "./libs/bower/jquery-ui/jquery-ui",
            "less": "./libs/bower/require-less/less",
            "less-builder": "./libs/bower/require-less/less-builder",
            "moment": "./libs/bower/momentjs/moment",
            "normalize": "./libs/bower/require-less/normalize",
            "numeral": "./libs/bower/numeral/numeral",
            "parsley": "libs/bower/parsleyjs/parsley",
            "select2": "./libs/bower/select2/select2",
            "sha256": "./libs/bower/cryptojslib/sha256",
            "socketio": "./libs/bower/socket.io-client/dist/socket.io",
            "text": "./libs/bower/requirejs-text/text",
            "underscore": "./libs/bower/lodash/lodash.compat",
            "underscore_string": "./libs/bower/underscore.string/lib/underscore.string",

            "when": "./libs/bower/when/when",

            "templates": "../templates",
            "fuse": "./libs/fuse",
            "range-slider": "libs/jQAllRangeSliders-min",
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

  grunt.registerTask("test", ["jshint"]);
  grunt.registerTask("build", ["bower", "requirejs"]);
  grunt.registerTask("default", ["test", "build"]);
};