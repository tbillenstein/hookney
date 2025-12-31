/**
 * Hookney - Helper around self referencing JSON objects for Node.js and the browser.
 *
 * @copyright: Copyright (c) 2016-present, tbillenstein
 *
 * @author: tbillenstein <tb@thomasbillenstein.com> (https://thomasbillenstein.com)
 *
 * @license This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


'use strict';

module.exports = function(grunt)
{
	grunt.initConfig(
	{
		pkg: grunt.file.readJSON('package.json'),

		terser: {
			options: {
				output: {
					preamble: '/*! <%= pkg.name %> V<%= pkg.version %>, Copyright (c) 2016-present, tbillenstein. MIT licensed. */',
					comments: false
				}
			},
			build: {
				src: '<%= pkg.name %>.js',
				dest: '<%= pkg.name %>.min.js'
			}
		},

		watch: {
			scripts: {
				files: [ '<%= pkg.name %>.js' ],
				tasks: [ 'default' ],
				options:
				{
					interrupt: true
				}
			}
		},

		jshint: {
			options: {
				esversion: 6,
				node: true,
				ignores: [
				]
			},
			all: [
				'Gruntfile.js',
				'<%= pkg.name %>.js',
				'spec/*.js'
			]
		}
	});

	// Load the plugins.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-terser');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Build task(s).
	grunt.registerTask('build', [ 'terser:build' ]);

	// Default task(s).
	grunt.registerTask('default', [ 'build' ]);
};
