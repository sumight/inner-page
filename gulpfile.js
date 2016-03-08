var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var browserify = require('browserify');
var gulp = require('gulp');
var jsHint = require("gulp-jshint");
var through2 = require("through2");
var replace = require("gulp-replace");
var uglify = require("gulp-uglify");
var rename = require('gulp-rename');
var less = require('gulp-less');
// 开启预览服务器
gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "./demo/",
            index: 'demo.html'
        },
        browser: "google chrome"
    });
});

gulp.task("jspack", function() {
    return gulp.src('./demo/src/*.js')
        .pipe(through2.obj(function(file, enc, next) {
            browserify(file.path, {
                    debug: false
                })
                .bundle(function(err, res) {
                    file.contents = res;
                    next(null, file);
                });
        }))
        .pipe(gulp.dest('./demo/dist'))
        .pipe(reload({
            stream: true
        }));
})

gulp.task("supportTradition", function() {
    return gulp.src('./innerPage.js')
        .pipe(through2.obj(function(file, enc, next) {
            browserify(file.path, {
                    debug: false
                })
                .bundle(function(err, res) {
                    if (err) {
                        console.log('browserify 编译失败'.error, err);
                        return;
                    }
                    file.contents = res;
                    next(null, file);
                });
        }))
        .pipe(replace(/\/\* @support tradition plugname\((\w*)\) \*\//g, "if(!!window.$1){throw new Error('全局变量冲突，$1')}else{window.$1 = module.exports}"))
        .pipe(gulp.dest('./demo/tradition'))
        .pipe(rename({suffix:'.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('./demo/tradition'))
        .pipe(reload({
            stream: true
        }));
})

gulp.task("lesspack", function(){
    return gulp.src(['./demo/src/*.less'])
        .pipe(less())
        .pipe(gulp.dest('./demo/dist/'))
        .pipe(gulp.dest('./demo/tradition'))
        .pipe(reload({
            stream: true
        }));
})


// 监听文件
gulp.task('watch', function() {
    gulp.watch(['./demo/src/*.js', './*.js'], ["jspack", "supportTradition"]);
    gulp.watch(['./demo/src/*.less', './*.less'], ["lesspack"]);
})


gulp.task("default", ['jspack', 'server', 'watch', 'supportTradition', 'lesspack']);