var gulp = require('gulp');
var minifyCSS = require('gulp-csso');
var uglify = require('gulp-uglify');
var pump = require('pump');
var concat = require('gulp-concat');

gulp.task('css', function(){
  return gulp.src('static/js/*.css')
    .pipe(minifyCSS())
    .pipe(gulp.dest('build/css'))
});

gulp.task('js', function (cb) {
  pump([
        gulp.src('static/js/*.js'),
        concat('all.js'),
        uglify(),
        gulp.dest('build/js')
    ],
    cb
  );
});

gulp.task('default', [ 'css', 'js' ]);