"use strict"

try { // Load required Node Modules

  var firebase = require("firebase");
  var fs       = require('fs');
  var cli      = require('cli-color');
  var os       = require('os');

  var APIUtil      = require('./APIUtil.js');
  var APIConfig    = require('./APIConfig.js');
  var BaseDevice   = require('./BaseDeviceClass.js');
  var Firebase     = require("firebase");
  var ProgressBar  = require('progress');

  var NetworkDiscover = require('./NetworkDiscover.js');

}
catch(e) {
  // Notify the user that we can't load a module...
 // console.error("Unable to load required module: " + e.message.match(/\'.*\'/g)[0] + ". \nSmartHome API cannot continue.\n\n");
  console.error(e.stack);
  // Kill this process...
  process.exit(1);

} // End try/catch block


// <!------------------------------------------- BEGIN SMART HOME API -------------------------------------------!> //


/**
 * SMART HOME API
 * Communicates with the Firebase Server and Individual Wi-Fi devices.
 */
var SmartHome = function() {

  var console = APIUtil.console;

  // <!------------------------- PRIVATE GLOBAL VARIABLES -------------------------!>

  // So we can reference this from within callbacks:
  var self = this;

  // Holds all the drivers:
  var drivers = {};

  // Holds all the interfaces:
  var interfaces = {};

  // The Firebase Reference:
  var fRef = null;

  // For file loading verification:
  var fileCount = 0;
  var numFiles = 0;
  var fileCountI = 0;
  var numFilesI = 0;

  var DriverIDs = -1;
  var nextDriverID = function () { return '0x' + ((++DriverIDs).toString(16)); }

  var Devices = [];

  var deviceFirebase = new Firebase(APIConfig.general.firebaseRootURI + '/' + APIConfig.general.firebaseAllDevicesPath);

  var networkDevices = undefined;

  // <!---------------------------- BEGIN PROGRAM FLOW ----------------------------!>

  // #1 ---> Write the restart to the log file.
  fs.writeFile(APIConfig.general.logPath, "\n-------------- SMART HOME API BOOT --------------\n\n", { flag: 'a', encoding: 'utf-8' });
  
  // #2 ---> Clear the console.
  console.clear();

  // #3 ---> Clean up configuration values...
  (function () {

    // Append a '/' to APIConfig.devices.driverDirectory if it doesn't have a trailing slash
    if(APIConfig.devices.driverDirectory.charAt(APIConfig.devices.driverDirectory.length - 1) != '/')
      APIConfig.devices.driverDirectory += '/';

    // Append a '/' to APIConfig.devices.driverInterfaces if it doesn't have a trailing slash
    if(APIConfig.devices.interfaceDirectory.charAt(APIConfig.devices.interfaceDirectory.length - 1) != '/')
      APIConfig.devices.interfaceDirectory += '/';

  })();
  

  // #4 ---> Show msg that Smart Home API Server is starting...
  console.warn("Smart Home API Server v" + APIConfig.general.version + " Booting on '" + os.platform() + "'...");

  // #5 ---> Load the device interfaces
  loadInterfaces();

  // #6 ---> Once the interfaces are loaded, load the device drivers:
  self.on("interfaces loaded", loadDrivers);

  // #6 ---> Setup the devices, based on the network devices connected:
  self.on("drivers loaded", scanNetwork);

  // Set an interval to continuiously re-scan the network:
  setInterval(scanNetwork, APIConfig.devices.scanInterval);


  // <!----------------------------- END PROGRAM FLOW -----------------------------!>


  function scanNetwork() {

    var bar = new ProgressBar(cli.xterm(124)('     Network Scan In Progress [:bar] :percent :etas'), {
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: 100
    });

    console.notice("Scanning network for connected devices...");
    console.log('', true);

    var scan = new NetworkDiscover.scan(bar);
    scan.on("discovery complete", function (dev) {
      bar.tick(100);
      console.log('', true);
      var devString = [];
      for(var i in dev) devString.push('    - ' + dev[i].name);
      
      console.notice("Network scan complete, " + Object.keys(dev).length + " devices found:\n" + devString.join("\n"));
      // Clear all currently connected devices
      deviceFirebase.remove();
      // Init all devices
      devicesInit(dev);
    });
  }


  /**
   * Loads the interfaces (as modules) which mitigates the functions each driver must implement.
   */
  function loadInterfaces () {

    // Tell the user we are loading the interfaces...
    console.notice("Loading Device Interfaces...");

    // Read the interface directory...
    fs.readdir(APIConfig.devices.interfaceDirectory, function (error, files) {

      // Silently print the error to the console.
      if(error) { console.error(error); return; }

      // Set numFilesI to the number of files in the interface directory...
      numFilesI = files.length;

      // Loop through each individual file
      files.forEach(function (f) {

        // Get file information for each file
        fs.stat(APIConfig.devices.interfaceDirectory + f, function (error, stat) {

          // Silently print the error to the console.
          if(error) { console.error(error); return; }

          // Split the filename into an array by the delimiter: '.'
          var fnTokens = f.split('.');
          
          // If the file is a file and not a directory and its extension is ".js" (javascript):
          if(stat.isFile() && fnTokens[fnTokens.length - 1] == "js") {

            var driverInterface = require(process.cwd() + "/" + APIConfig.devices.interfaceDirectory + f);

            (driverInterface.type) ?
              interfaces[driverInterface.type.toLowerCase()] = driverInterface :
              console.error("Interface with filename '" + f + "' doesn't declare a type!\nThis interface will not be loaded.");

            console.notice("Interface for '" + driverInterface.type.toLowerCase() + "' devices loaded!");

          } // End if stat.isFile()... block
          
          // Increment the fileCount
          fileCountI++;

        }); // End fs.stat()

      }); // End files.forEach()

    }); // End fs.readdir()
  
    var intervalSumI = 10;
    var intervalI = setInterval(function () {

      if(intervalSumI > APIConfig.general.deviceLoadTimeout) { // Took too long to load interfaces, something's wrong...
        console.error("Unable to load device interfaces. SmartHome API cannot continue.");
        process.exit(1); // POSIX Failure Code
      }
      else if(fileCount >= numFiles) {
        console.notice("Interface Loading Complete...");
        self.emit("interfaces loaded", interfaces);
        clearInterval(intervalI);
      }

      intervalSumI += 10;

    }, 10); // End interval

  } // End loadInterfaces



  /**
   * Load the device drivers (as modules) which communicate with each individual Wi-Fi device:
   */
  function loadDrivers () {

    // Notify the user we are loading the drivers:
    console.notice("Loading Device Drivers...");

    // Read the files in the driver's directory.
    fs.readdir(APIConfig.devices.driverDirectory, function (error, files) {

      // Silently print the error to the console.
      if(error) { console.error(error); return; }

      // Set numFiles equal to the number of files in the driver directory.
      // We need this to check if all have loaded successfully.
      numFiles = files.length;

      // Loop through each file
      files.forEach(function (f) {

        // Get file information for each file
        fs.stat(APIConfig.devices.driverDirectory + f, function (error, stat) {

          // Silently print the error to the console.
          if(error) { console.error(error); return; }

          // Split the filename into an array by the delimiter: '.'
          var fnTokens = f.split('.');
          
          // If the file is a file and not a directory and its extension is ".js" (javascript):
          if(stat.isFile() && fnTokens[fnTokens.length - 1] == "js") {

            var deviceDriver = undefined;

            try { // Try to load the device driver into memory as a node module:

              deviceDriver = require(process.cwd() + "/" + APIConfig.devices.driverDirectory + f);

              if(!validateDeviceDriver(deviceDriver, f)) {
                
                // If driver validation fails, show a message and goto the next driver, fail "silently."
                console.error("Device Driver '" + f + "' has failed validation.\nThis driver will not load, and supported devices will be unable to use this driver.");

              }
              else { // The driver passed validation.

                // Notify the user and add the driver to the driver's array.
                deviceDriver.driverDetails.driverID = nextDriverID();
                console.notice("Device Driver for device '" + deviceDriver.driverDetails.make + " " + deviceDriver.driverDetails.model + "' (v" + deviceDriver.driverDetails.version + ", id:" + deviceDriver.driverDetails.driverID + ") loaded!");
                drivers[deviceDriver.driverDetails.driverID] = deviceDriver;

              } // End if/else block

            }
            catch(e) { // We couldn't "require" the device driver module...
              throw e;
              console.error("Device Driver '" + f + " failed to compile with message:\n" + e.message + "\nThis driver will not load, and supported devices will be unable to use this driver.");
            
            } // End try/catch block

          } // End if stat.isFile()... block
          
          // Increment the fileCount
          fileCount++;

        }); // End fs.stat()

      }); // End files.forEach()

    }); // End fs.readdir()
  
    // Set an interval to check for device driver loading completion.
    var intervalSum = 10;
    var interval = setInterval(function () {

      if(intervalSum > APIConfig.general.deviceLoadTimeout) { // Took too long to load drivers, something's wrong...
        console.error("Unable to load device drivers. SmartHome API cannot continue.");
        process.exit(1); // POSIX Failure Code
      }
      else if(fileCount >= numFiles) {
        console.notice("Driver Loading Complete...");
        self.emit("drivers loaded", drivers);
        clearInterval(interval);
      }

      intervalSum += 10;

    }, 10); // End interval

  } // End loadDrivers()



  /**
   * Sets up individual devices
   */
   function devicesInit (networkDevices) {

    Devices = {};

    for(var i in drivers) { // Loop
      for(var n in networkDevices) {
        for(var k in drivers[i].driverKeywords) {
          if(networkDevices[n].name.match(RegExp(drivers[i].driverKeywords[k], 'ig'))) {
            Devices[networkDevices[n].mac] = new drivers[getDriverID(drivers[i].driverDetails.make, drivers[i].driverDetails.model, drivers[i].driverDetails.version)](networkDevices[n].name, networkDevices[n].address, networkDevices[n].mac);
            console.notice("Found Supported " + Devices[networkDevices[n].mac].toString());
            deviceFirebase.child(networkDevices[n].mac).set({
              name: networkDevices[n].name,
              address: networkDevices[n].address,
              mac: networkDevices[n].mac,
              supported: true,
              driver: {
                make    : drivers[i].driverDetails.make,
                type    : drivers[i].driverDetails.type,
                model   : drivers[i].driverDetails.model,
                version : drivers[i].driverDetails.version,
              }
            }); // End set()
            Devices[networkDevices[n].mac].emit("ready");
            break;
          }
          else {
            deviceFirebase.child(networkDevices[n].mac).set({
              name: networkDevices[n].name,
              address: networkDevices[n].address,
              mac: networkDevices[n].mac,
              supported: false,
              driver: "none"
            }); // End set()
          }
        }
      }
    }

    if(!Devices || Object.keys(Devices).length == 0) {
      console.warn("No supported devices were found!\nNext network discovery scan will occur again in: " + APIConfig.devices.scanInterval + " ms.");
    }
    else {
      console.warn("Next network discovery scan in: " + APIConfig.devices.scanInterval + " ms.");
    }

   } // End devicesInit()


  /**
   * Utility function to validate a specific device driver.
   * @param c - The device driver as a node module
   * @param f - The device driver's filename
   */
  function validateDeviceDriver (c, f) {

    if(Object.keys(c).length == 0) { // If the device driver required is empty:
      console.error("Device Driver '" + f + "' is empty!\nDid you forget to export your driver object?");
      return false;
    }

    // Make sure the device implements the 'onFirebaseData' function:
    if(!c.prototype.onFirebaseData && !(c.prototype.onFirebaseData instanceof Function)) {
      console.error("Device Driver '" + f + "' does not implement the 'onFirebaseData' method.");
      return false;
    }

    // Make sure the we implement the device details...
    if(!c.driverDetails) {
      console.error("Device Driver '" + f + "' does not define it's driver details (property 'driverDetails').");
      return false;
    }

    if(!c.driverKeywords) {
      console.warn("Device Driver '" + f + "' does not define any driver keywords (property 'driverKeywords').\nIt will be unable to be paired to any network deivces.");
    }


    // Make sure the driver implements its type
    var doesImplement = c.prototype.implements(interfaces[c.driverDetails.type.toLowerCase()]);

    if(!interfaces[c.driverDetails.type.toLowerCase()] || doesImplement !== true) {
      console.error("Device Driver '" + f + "' does not fully impletment the '" + c.driverDetails.type.toLowerCase() + "' interface:");
      for(var n in doesImplement) console.error("                          - Missing method '" + doesImplement[n] + "'", true);
      return false;
    }

    return true;

  } // End validateDeviceDriver


  /**
   * Get a driver by it's make, model and version:
   */
  function getDriverID (make, model, version) {

    for(var i in drivers) {
      if(drivers[i].driverDetails.make.toLowerCase()    == make.toLowerCase() &&
         drivers[i].driverDetails.model.toLowerCase()   == model.toLowerCase() && 
         drivers[i].driverDetails.version.toLowerCase() == version.toString().toLowerCase())
          return i;
    }

    return undefined;

  } // End getDriverID()


} // --------------------------> End SmartHome Object Function


// Inherit from the "EventEmitter" so we can emit events:
require('util').inherits(SmartHome, require('events').EventEmitter);
// Export the module:
module.exports = new SmartHome();