/* eslint-disable */
/** Taken from https://github.com/babel/babel/blob/master/Gulpfile.js */

'use strict';

const plumber = require('gulp-plumber');
const through = require('through2');
const chalk   = require('chalk');
const newer   = require('gulp-newer');
const babel   = require('gulp-babel');
const watch   = require('gulp-watch');
const gutil   = require('gulp-util');
const gulp    = require('gulp');
const path    = require('path');

const scripts = './packages/*/src/**/*.js';
const dest = 'packages';

let srcEx;
let libFragment;

if (path.win32 === path) {
  srcEx = /(packages\\[^\\]+)\\src\\/;
  libFragment = '$1\\lib\\';
} else {
  srcEx = new RegExp('(packages/[^/]+)/src/');
  libFragment = '$1/lib/';
}

gulp.task('default', ['build']);

gulp.task('build', function () {
  return gulp.src(scripts)
    .pipe(plumber({
      errorHandler: function (err) {
        gutil.log(err.stack);
      }
    }))
    .pipe(through.obj(function (file, enc, callback) {
      file._path = file.path;
      file.path = file.path.replace(srcEx, libFragment);
      callback(null, file);
    }))
    .pipe(newer(dest))
    .pipe(through.obj(function (file, enc, callback) {
      gutil.log('Compiling', '"' + chalk.cyan(file._path) + '"...');
      callback(null, file);
    }))
    .pipe(babel())
    .pipe(gulp.dest(dest));
});

gulp.task('watch', ['build'], function (callback) {
  watch(scripts, {debounceDelay: 200}, function () {
    gulp.start('build');
  });
});
