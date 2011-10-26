#!/usr/bin/env node

const
spawn = require('child_process').spawn,
path = require('path');

var daemons = [];

const HOST = process.env['IP_ADDRESS'] || process.env['HOST'] || "127.0.0.1";

var daemonsToRun = {
  verifier: {
    PORT: 10000,
    HOST: HOST
  },
  browserid: {
    PORT: 10001,
    HOST: HOST
  },
  example: {
    path: path.join(__dirname, "..", "scripts", "serve_example.js")
  }
};

// all spawned processes should log to console
process.env['LOG_TO_CONSOLE'] = 1;

// all spawned processes will communicate with the local browserid
process.env['BROWSERID_URL'] = 'http://' + HOST + ":10001";

Object.keys(daemonsToRun).forEach(function(k) {
  Object.keys(daemonsToRun[k]).forEach(function(ek) {
    process.env[ek] = daemonsToRun[k][ek];
  });
  var pathToScript = daemonsToRun[k].path || path.join(__dirname, "..", "bin", k);
  var p = spawn('node', [ pathToScript ]);

  function dump(d) {
    d.toString().split('\n').forEach(function(d) {
      if (d.length === 0) return;
      console.log(k, '(' + p.pid + '):', d);
    });
  }

  p.stdout.on('data', dump);
  p.stderr.on('data', dump);

  console.log("spawned", k, "("+pathToScript+") with pid", p.pid); 
  Object.keys(daemonsToRun[k]).forEach(function(ek) {
    delete process.env[ek];
  });

  daemons.push(p);

  p.on('exit', function (code, signal) {
    console.log(k, 'exited with code', code, (signal ? 'on signal ' + signal : ""));
    daemons.splice(daemons.indexOf(p), 1);
    daemons.forEach(function (p) { p.kill(); });
    if (daemons.length === 0) {
      console.log("all daemons torn down, exiting...");
    }
  });
});
