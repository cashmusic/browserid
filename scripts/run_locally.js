#!/usr/bin/env node

const
spawn = require('child_process').spawn,
path = require('path');

var daemons = [];

var daemonsToRun = {
  verifier: {
    PORT: 10000,
    HOST: process.env['IP_ADDRESS'] || "127.0.0.1"
  },
  browserid: {
    PORT: 10001,
    HOST: process.env['IP_ADDRESS'] || "127.0.0.1"
  }
};

// all spawned processes should log to console
process.env['LOG_TO_CONSOLE'] = 1;

Object.keys(daemonsToRun).forEach(function(k) {
  Object.keys(daemonsToRun[k]).forEach(function(ek) {
    process.env[ek] = daemonsToRun[k][ek];
  });
  var p = spawn(
    'node',
    [ path.join(__dirname, "..", "bin", k) ]
  );

  function dump(d) {
    d.toString().split('\n').forEach(function(d) {
      if (d.length === 0) return;
      console.log(k, '(' + p.pid + '):', d);
    });
  }

  p.stdout.on('data', dump);
  p.stderr.on('data', dump);

  console.log("spawned", k, "with pid", p.pid); 
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

// finally, let's run a tiny webserver for the example code.
