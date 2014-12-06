"use strict"

var os   = require('os');
var sys  = require('sys')
var exec = require('child_process').exec;

var APIConfig = require('../APICore/APIConfig.js');
var console   = require('../APICore/APIUtil.js').console;


/**
 * Get's the local IPv4 address of the current machine
 * @return An array of IP addresses
 */
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


/**
 * Parse NMap output for the SmartHome API
 * @return - A list of network devices
 */
function cleanNMap (nmap) {

  // Holds all devices
  var devices = {}

  if(os.platform() != 'win32') { // If Windows... RegExp reacts different on different OS's... weird!

    nmap = nmap
      .replace(/Starting(.*)(\n+)?/i, '') // Strip out the starting line.
      .replace(/Nmap scan report for(\s+)?(.*?)(\n+)/gi, '$2,') // Strip out 
      .replace(/Host is up.*(\n+)?/gi, '')
      .replace(/MAC Address:(\s+)?(.*?)(\s+)?\((.*?)\)/ig, '$2,$4')
      .replace(/Nmap done:.*(\n+)?/, '')
      .replace(/\s\s+/ig, '')
      .split(/\n/);
  }
  else { // Linux or Mac

    nmap = nmap
      .replace(/Starting(.*)(\n+)?/i, '')
      .replace(/Nmap scan report for (.*?)(\n+)?/ig, '$1')
      .replace(/Host is up.*(\n+)?/gi, '')
      .replace(/MAC Address:(\s+)?(.*?)(\s+)?\((.*?)\)/ig, ',$2,$4\|')
      .replace(/Nmap done:.*(\n+)?/, '')
      .replace(/\s\s+/ig, '')
      .split(/\|/);

  } // End if/else block

  for(var i in nmap) {
    var d = nmap[i].split(/,/ig);
    if(d[1]) devices[d[1]] = { name: d[2] || "", address: d[0] || "0.0.0.0", mac: d[1] || "00:00:00:00:00:00" }
  }

  return devices;

} // End cleanNMap()


// <------------------------------ EXECUTE NAMP ------------------------------> //

/**
 * Executes NMap, get's the list of devices, and pings each one to verify existence and connection.
 */
var NetworkDiscover = function () {

  var self = this;
  var pingsComplete = 0;

  self.lastScan = Date.now();

  // Holds each device on the network:
  var devices;

  var localIP = getLocalIP();
  if(localIP instanceof Array) localIP = localIP[localIP.length -1];

  // Execute NMap
  console.warn("Executing NMap on Local Network " + localIP + "...");

  var platform = os.platform();
  var cmd = platform != 'win32' ? "sudo nmap -sP " + localIP + "/24" : "nmap -sP " + localIP + "/24";
  console.warn("You *may* be prompted to enter your administrative password,\nif you are not already an administrator.\n\nNMap requires authentication to obtain MAC Addresses.\n");

  exec(cmd, function (error, stdout, stderr) {

    if(error) {
      console.error("There was an error executing NMap, do you have administrative privileges?");
      console.error("SmartHome API will now exit.");
      process.exit();
      return;
    }

    if(stderr) {
      console.error("There was an error executing NMap, do you have administrative privileges?");
      console.error("SmartHome API will now exit.");
      process.exit();
      return;
    }

    devices = cleanNMap(stdout);

    console.warn("Pinging " + Object.keys(devices).length + " device(s) to verify connectivity...");

    // Ping each device to make sure we can connect to it.
    for(var i in devices) {

      exec("ping " + (os.platform() == 'win32' ? "-n 3 " : "-c 3 ") + devices[i].address, function (error, stdout, stderr) {

        if(!(error || stderr)) {

          // The percentage of packet loss:
          if(os.platform() == 'win32') {
            var loss = Number(stdout.match(/(\d+(\.\d+)?)\% loss/ig)[0].replace(/\% loss/, ''));
          }
          else {
            var loss = Number(stdout.match(/(\d+(\.\d+)?)\% packet loss/ig)[0].replace(/\% packet loss/, ''));
          }

          // Drop the device, if the loss is above the threshold.
          if(loss > APIConfig.devices.packetLossThreshold) delete devices[i];

        }

        console.notice("Ping Results:\n\n" + stdout);
        // Emit the event that this device was pinged
        self.emit("pinged");

      }); // End exec(ping)


    } // End for loop

    // Increment the number of devices pinged
    self.on("pinged", function () {
      pingsComplete++;
    })

    // Check the number of devices pings every 60 ms.
    // If the number of devices pinged == the number of devices, then discovery is complete.
    var pingInterval = setInterval(function() {

      if(pingsComplete >= Object.keys(devices).length) {

        // Emit the "discovery complete" event
        self.emit("discovery complete", devices);

        // Reset the number of pings to each device for the next network discovery.
        pingsComplete = 0;

        // Clear the interval, so it stops checking
        clearInterval(pingInterval);

      } // End if block

    }, 60);

  }); // End exec(nmap)

} // End NetworkDiscover()


// Inherit from the "EventEmitter" so we can emit events:
require('util').inherits(NetworkDiscover, require('events').EventEmitter);

// Export the object as a function named "scan":
exports.scan = NetworkDiscover;
