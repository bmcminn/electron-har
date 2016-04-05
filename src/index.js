var tmp = require('tmp');
var assign = require('object-assign');
var fs = require('fs');
var childProcess = require('child_process');

/**
 * @param {string} url url (e.g. http://google.com)
 * @param {object} o CLI options (NOTE: only properties not present in (or different from) CLI are described below)
 * @param {object|string} o.user either object with 'name' and 'password' properties or a string (e.g. 'username:password')
 * @param {string} o.user.name username
 * @param {string} o.user.password password
 * @param {string} o.user-agent user device profile name
 * @param {string} o.limit-rate network throttling profile name
 * @param {string} o.landscape force device profile to be landscape
 * @param {function(err, json)} callback callback (NOTE: if err != null err.code will be the exit code (e.g. 3 - wrong usage,
 * 4 - timeout, below zero - http://src.chromium.org/svn/trunk/src/net/base/net_error_list.h))
 */
module.exports = function electronHAR(url, options, callback) {
  typeof options === 'function' && (callback = options, options = {});

  // Using temporary file to prevent messages like "Xlib:  extension ...",
  // "libGL error ..." from cluttering stdout in a headless env (as in Xvfb).
  tmp.file(function (err, path, fd, cleanup) {

    if (err) {
      return callback(err);
    }


    // Map options into config object.
    var config = assign({}, options, {
      output: path,
      user: options.user === Object(options.user) ?
        options.user.name + ':' + options.user.password :
        options.user,
      'user-agent': options['user-agent'] ? options['user-agent'] : null,
      'limit-rate': options['limit-rate'] ? options['limit-rate'] : null,
      landscape: options['landscape'] ? options['landscape'] : null
    });


    // The arguments object to pass to the spawned process.
    var args = [url].concat(
      Object
        .keys(config)
        .reduce(function (n, flag) {
          argv = ''
          if (config[flag] !== undefined && config[flag] !== null ){
            argv = flag.length === 1 ? '-' + flag : '--' + flag;
            argv += ' ' + config[flag];
          }
          return argv;
        }, [])
    )

    // The callback for the spawned process.
    var processCallback = function (err, stdout, stderr) {
      if (err) {
        if (stderr) {
          err.message = stderr.trim();
        }

        return callback(err);
      }

      fs.readFile(path, 'utf8', function (err, data) {
        if (err) {
          return callback(err);
        }

        try {
          callback(null, JSON.parse(result));
        } catch (e) {
          return callback(e);
        }
      });
    }

    // Initialise the electron-har process using spawn
    // as cross-exec-file (exec-file) results in stdout maxBuffer exceeded errors.
    var command = childProcess.spawn(__dirname + '/../bin/electron-har', args)
    var result = ''
    command.stdout.on('data', function(data){
      result += data.toString();
    })
    command.on('close', processCallback)
  });
};
