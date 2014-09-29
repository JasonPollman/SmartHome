"use strict"

var os   = require('os');
var sys  = require('sys')
var exec = require('child_process').exec;

var APIConfig = require('../APICore/APIConfig.js');
var console   = require('../APICore/APIUtil.js').console;

function getLocalIP () {

  var interfaces = os.networkInterfaces();
  var addresses = [];

  for (var k in interfaces) {

    for (var n in interfaces[k]) {
      var address = interfaces[k][n];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }

    } // End inner for loop

  } // End outer for loop

  return addresses;

} // End getLocalIP()



function cleanNMap (nmap) {

  var devices = {}

  if(os.platform() != 'win32') { // RegExp reacts different on different OS's
    nmap = nmap
      .replace(/Starting(.*)(\n+)?/i, '')
      .replace(/Nmap scan report for(\s+)?(.*?)(\n+)/gi, '$2,')
      .replace(/Host is up.*(\n+)?/gi, '')
      .replace(/MAC Address:(\s+)?(.*?)(\s+)?\((.*?)\)/ig, '$2,$4')
      .replace(/Nmap done:.*(\n+)?/, '')
      .replace(/\s\s+/ig, '')
      .split(/\n/);
  }
  else {
    nmap = nmap
      .replace(/Starting(.*)(\n+)?/i, '')
      .replace(/Nmap scan report for (.*?)(\n+)?/ig, '$1')
      .replace(/Host is up.*(\n+)?/gi, '')
      .replace(/MAC Address:(\s+)?(.*?)(\s+)?\((.*?)\)/ig, ',$2,$4\|')
      .replace(/Nmap done:.*(\n+)?/, '')
      .replace(/\s\s+/ig, '')
      .split(/\|/);
  }

  for(var i in nmap) {
    var d = nmap[i].split(/,/ig);
    if(d[1]) devices[d[1]] = { name: d[2] || "", address: d[0] || "0.0.0.0", mac: d[1] || "00:00:00:00:00:00" }
  }

  return devices;

} // End cleanNMap()


// <------------------------------ EXECUTE NAMP ------------------------------> //
var NetworkDiscover = function (bar) {

  bar.tick(5);
  var self = this;
  var pingsComplete = 0;

  // Holds each device on the network:
  var devices;

  // Execute NMap
  exec("nmap -sP " + getLocalIP() + "/24", function (error, stdout, stderr) {

    bar.tick(5);
    devices = cleanNMap(stdout);

    // Ping each device to make sure we can connect to it.
    for(var i in devices) {

      bar.tick(5);
      exec("ping " + (os.platform() == 'win32' ? "-n 3" : "-c 3 ") + devices[i].address, function (error, stdout, stderr) {

        bar.tick(5);
        if(!(error || stderr)) {
          
          // The percentage of packet loss:
          var loss = Number(stdout.match(/(\d+(\.\d+)?)\% packet loss/)[0].replace(/\% packet loss/, ''));

          // Drop the device, if the loss is above the threshold.
          if(loss > APIConfig.devices.packetLossThreshold) delete devices[i];
          
        }
        bar.tick(5);
        self.emit("pinged");

      }); // End exec(ping)
      

    } // End for loop

    self.on("pinged", function () {
      pingsComplete++;
    })

    var pingInterval = setInterval(function() {
      if(pingsComplete >= Object.keys(devices).length) {
        self.emit("discovery complete", devices);
        pingsComplete = 0;
        clearInterval(pingInterval);
      }
    }, 60);

  }); // End exec(nmap)

} // End NetworkDiscover()


// Inherit from the "EventEmitter" so we can emit events:
require('util').inherits(NetworkDiscover, require('events').EventEmitter);

exports.scan = NetworkDiscover;
