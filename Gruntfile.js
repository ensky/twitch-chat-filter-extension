module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      build: {
        src: ["opt"]
      }
    },

    copy: {
      main: {
        files: [
          // includes files within path
          {expand: true, cwd: 'src/', src: ['**'], dest: 'opt/'}

          // includes files within path and its sub-directories
          // {expand: true, src: ['path/**'], dest: 'dest/'},

          // makes all src relative to cwd
          // {expand: true, cwd: 'path/', src: ['**'], dest: 'dest/'},

          // flattens results to a single level
          // {expand: true, flatten: true, src: ['path/**'], dest: 'dest/', filter: 'isFile'}
        ]
      }
    },

    htmlmin: {                                     // Task
      dist: {                                      // Target
        options: {                                 // Target options
          removeComments: true,
          collapseWhitespace: true
        },
        files: [{
            expand: true,
            cwd: 'src',
            src: '**/*.html',
            dest: 'opt'
        }]
      }
    },

    uglify: {
      options: {
        mangle: true,
        compress: {
          drop_console: true
        }
      },
      my_target: {
        files: [{
            expand: true,
            cwd: 'src',
            src: '**/*.js',
            dest: 'opt'
        }]
      }
    },

    // make a zipfile
    compress: {
      main: {
        options: {
          archive: 'opt.zip'
        },
        files: [
          // {src: ['path/*'], dest: 'internal_folder/', filter: 'isFile'}, // includes files in path
          {src: ['opt/**'], dest: ''}, // includes files in path and its subdirs
          // {expand: true, cwd: 'path/', src: ['**'], dest: 'internal_folder3/'}, // makes all src relative to cwd
          // {flatten: true, src: ['path/**'], dest: 'internal_folder4/', filter: 'isFile'} // flattens results to a single level
        ]
      }
    }

  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Default task(s).
  grunt.registerTask('default', ['clean', 'copy', 'uglify', 'htmlmin', 'compress']);

};