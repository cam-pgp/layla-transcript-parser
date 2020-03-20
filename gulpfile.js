'use strict';

const gulp = require('gulp'),
spawn = require('child_process').spawn;

    let node;

async function startServer() {
    if (node) node.kill();
    node = await spawn("node", ["./server.js"], {stdio: "inherit"});

    node.on("close", function (code) {
        if (code === 8) {
            console.log("Error detected, waiting for changes...");
        }
    });
}

gulp.task('watch', function () {
    gulp.watch('./app.js', startServer);
});


