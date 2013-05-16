/* global module */
'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // our lint tool, will get run on file changes
        // if you run `grunt watch`
        jshint: {
            all: [
                './*.js',
                'lib/**/*.js',
                'test/**/*.js',
                'test/*/*.js'
            ],
            options: {
                jshintrc: './.jshintrc'
            }
        },

        // Buster is our unit testing framework.
        // This task will be automatically run on file changes if
        // you run `grunt watch`
        buster: {
            test: {
            }
        },

        // Creates documentation using the yuidoc program.
        // This task is not run with the main watcher, if you want
        // your changes to be automatically written to the api docs
        // you can run the `grunt watch:docs` task
        yuidoc: {
            compile: {
                name: '<%= pkg.name %>',
                description: '<%= pkg.description %>',
                version: '<%= pkg.version %>',
                url: '<%= pkg.homepage %>',
                options: {
                    paths: './lib/',
                    outdir: './docs/'
                }
            }
        },

        // A static file server that serves the api documentation on
        // port 8888 when the `grunt connect:docs` command are run.
        // This task will run forever, so don't use it as part of a
        // chain of tasks!
        connect: {
            docs: {
                port: 8888,
                base: 'docs/'
            }
        },

        // Automatically run tasks when files changes
        watch: {
            scripts: {
                files: '<%= jshint.all %>',
                tasks: ['clear', 'jshint', 'buster']
            },
            docs: {
                files: [
                    'lib/**/*.js'
                ],
                tasks: ['docs']
            }
        }
    });


    // load tasks from grunt plugins
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-clear');
    grunt.loadNpmTasks('grunt-buster');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-connect');


    // Shortcuts to tasks
    grunt.registerTask('test', 'buster');
    grunt.registerTask('docs', 'yuidoc');

    grunt.registerTask('default', ['docs', 'jshint:all', 'buster']);

};