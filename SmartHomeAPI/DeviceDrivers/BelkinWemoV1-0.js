"use strict"

/**
 * Belkin Wemo v1.0 API
 * -----------------------------------------------------------------------------
 * 
 * -----------------------------------------------------------------------------
 * Methods that must be implemented:
 * -----------------------------------------------------------------------------
 *
 *   - onFireBaseData()
 *       Each time a user change's one of their settings, this method is called.
 *
 *   - connect()
 *       Used by the API to attempt to make a connection to the device once the 
 *       driver is paired to the device, if the connection fails, that pair-bond
 *       is broken.
 *
 *   - Any other method as defined in this device's 'type' interface.
 *
 * -----------------------------------------------------------------------------
 * Helper Methods/Properties:
 * -----------------------------------------------------------------------------
 *
 *   - this.name
 *       The name of the network device.
 *
 *   - this.mac
 *       The MAC address of the device.
 *
 *   - this.address
 *       The local address of the device.
 *
 *   - this.firebase
 *       The firebase reference to the "device_data/[this.mac]/settings" path.
 *
 *   - this.firebaseURI
 *       The string representing the firebase path to the
 *       "device_data/[this.mac]/settings" path.
 *
 *   - this.updateStatus
 *       Updates the user's and devices status. Should only be called from
 *       the onFirebaseData method.
 *
 *   - this.users
 *       Returns all user's as an object in the format:
 *       { username: { [ALL_FIREBASE_CHILDREN] } ... }
 *
 *   - this.emit([String event], [Mixed args])
 *       Emit an event, for which all method that are listening to the event's 
 *       'on' or 'once' methods will be executed.
 *       Google "node event emitter" for more details.
 *
 *   - Driver.prototype.construct([null])
 *       Will be called when the driver is instantiated.
 *       You don't have to implement this, but if you want to do some init stuff
 *       this is the place to do it (e.g. import the device's settings).
 *
 *   - x.setEqual(y)
 *       Will set object x "equal to" y. Remember objects are passed by ref.
 *       So, setEqual duplicated the keys/values from y and adds them to x.
 *
 * -----------------------------------------------------------------------------
 * Driver Dependencies:
 * -----------------------------------------------------------------------------
 *
 *   - APIUtil.console
 *       So we can control the formatting of data piped to stdout.
 *
 *   - request
 *       A module to abstract making HTTP requests (much easier).
 *       See: https://www.npmjs.org/package/request for more info.
 *
 *   - BaseDeviceClass.js
 *      The object in which the driver inherits from.
 *      There are many methods that the API will verify exists,
 *      so either you must inherit from the BaseDeviceClass object,
 *      or re-write all of those methods here.
 *
 * -----------------------------------------------------------------------------
 * Using "return":
 * -----------------------------------------------------------------------------
 * The request and BaseDeviceClass modules are async. Meaning, you should use
 * callbacks rather than returning values. If you find that you can't figure out
 * why you're code is executing before something else that it shouldn't remember
 * this:
 *
 * var foo = functionA(arg1, arg2) <--- async function
 * console.log(foo);               <--- most likely null, since functionA
 *                                      doesn't return anything, but instead
 *                                      implements a callback.
 *                                      These parameters are typically
 *                                      named 'cb'.
 *
 * Instead use a callback:
 * -----------------------
 * function callback(foo) { console.log(foo); }
 * functionA(arg1, arg2, callback);        <--- Do not call the function with
 *                                              (), that would be passing its
 *                                              value, just pass the function
 *                                              itself.
 *
 * Or use an anonymous function:
 * -----------------------------
 * functionA(arg1, arg2, function (foo) {
 *  console.log(foo);
 * });
 *
 */


// Ohhh, pretty colors...
var console    = require('../APICore/APIUtil.js').console;

var APIConfig  = require('../APICore/APIConfig.js');
var UserConfig = require("../APICore/Users");

// Use the WeMo Module
var wemo = require('wemo');

// A great module for making easy requests:
var request = require('request');

// We must delete device cache so that we get a new copy of the BaseDeviceClass
delete require.cache[require.resolve("../APICore/BaseDeviceClass.js")];

// *** Inherit from the BaseDeviceClass ***
var BelkinWemo = require("../APICore/BaseDeviceClass.js");

// Must include driver's details!
// This defines the information used by the API to store/retrieve drivers.
// Will throw an error if non-existent.
BelkinWemo.driverDetails = {
  make    : "Belkin",   // REQUIRED
  model   : "Wemo",     // REQUIRED
  version : "1.0.0",    // REQUIRED
  type    : "power",    // REQUIRED
}

// Must include driver's keywords!
// This defines the information used by the API to pair drivers to devices.
// Will throw an error if non-existent.
BelkinWemo.driverKeywords = [
  "belkin international"
]

// If discoverable is true, use the discover method rather than
// using keywords (more reliable).
BelkinWemo.discoverable = true;

/**
 * Discover WeMo Devices
 * @param cb - The callback that will get executed when the device is discovered,
 *             you must pass back an object with the following keys:
 *                - address
 *                - name
 *                - port
 *             ...in order for the device to be paired correctly.
 */
BelkinWemo.discover = function (driver, cb) {

  // Create a new WeMo Client
  var client = wemo.Search();
  // When the client is found, call the callback...
  client.on('found', function(device) {

    // Object to pass to the callback, with the device's properties...
    var deviceInfo = {
      address: device.ip,
      port: device.port,
      name: device.friendlyName
    }

    // Call the callback
    if(cb instanceof Function) cb.call(null, driver, deviceInfo);

  }); // End of client.on()
 
} // End BelkinWemo.discover()


/**
 * Sets the settings in the devices: "device_data/[MAC]/settings" firebase object.
 * Make sure you set self.settings!!!
 */
BelkinWemo.prototype.setSettings = function (cb) {

  // For scoping, inside a callback, the 'this' keyword has changed...
  // now we can use 'self' to refer to this in a callback.
  var self = this;

  self.wemoDevice = new wemo(self.address, self.port);

  // Get the device's state
  self.wemoDevice.getBinaryState(function (error, result) {

    if(error) { // If there's an error, print the error silently and return
      console.error("Unable to get device state for device: " + self.toString());
      return;
    }

    // To pass to firebase
    var settings = {
      state: result,
      type: self.name.toLowerCase().replace(/\s+/ig, "_"),
    }

    // Update the device's settings
    self.settings = settings;

    // Call the callback which the base device will call and emit the ready event.
    if(cb instanceof Function) cb.call(self);

    // Emit the device found event
    self.emit("device found");

  }); // End wemoDevice()

  // Set an interval to update the motion status for a WeMo Motion
  self.once("device found", function () {

    if(self.name == "wemo_motion") { // If it's a wemo motion...

      // Emit that we have set this interval... since the network will be scanned and refreshed every XX seconds,
      // we have to clear the previous interval, so that we don't set multiple intervals...
      self.emit("setting new motion interval");

      self.on("setting new motion interval", function () {
        clearInterval(self.motionInterval); // The old motion interval...
      });

      // Set the new motion interval
      self.motionInterval = setInterval(function () {

         self.wemoDevice.getBinaryState(function (error, result) { // Get the WeMo Motion's state

            if(error) { // If there's an error, print the error silently and return
              console.error("Unable to get device state for device: " + self.toString());
              return;
            }

            if(result != self.settings.state) { // If the result from the device doesn't match the state in firebase...

              // Report that a motion detection was changed...
              console.notice("Device " + self.toString() + "\n\n...Motion detection state changed to: '" + ((result == 1) ? "on" : "off") + "'.");
              
              // Update the firebase device_data state...
              self.settings.state = result;
              
              // Update the users' states...
              for(var i in UserConfig.users) {
                if(UserConfig.users[i][APIConfig.general.firebaseUserSettingsPath] && 
                  UserConfig.users[i][APIConfig.general.firebaseUserSettingsPath][self.mac]) {
                  UserConfig.users[i][APIConfig.general.firebaseUserSettingsPath][self.mac] = self.settings;
                  self.firebase.update(self.settings);
                  self.firebaseUsers.update(UserConfig.users);
                }
              }
              
            } // End if block

          }); // End wemoDevice()

      }, 1000); // End setInterval() ** That's every second **

    } // End if block 

  }); // End self.once()

} // End setSettings()


// The constructor for this device is setSettings()!
BelkinWemo.prototype.construct = BelkinWemo.prototype.setSettings;


/**
 * Handles all firebase data changes from each user.
 * When a user change's a firebase setting for this device...
 * this method will be called.
 *
 * @param data - The changed data.
 * @param lastState - The data from the previous state.
 * @param updateStatus - Alias for this.updateStatus.
 * @param diff - An object containing the differences between 'data' and 'lastState'.
 *               Where the 'lhs' key is the previos state's value and the 'rhs' key
 *               is the new value.
 *               
 *               Example:
 *                  [
 *                    {
 *                      kind: 'E',
 *                      path: [ 'lights', 2, 'state', 'hue' ],
 *                      lhs: 33333,
 *                      rhs: 2222
 *                    }
 *                  ]
 *
 *               See: https://www.npmjs.org/package/deep-diff for more info.
 */
BelkinWemo.prototype.onFirebaseData = function (diff, data, lastState, updateStatus) {
  
  var self = this;
  
  for(var i in diff) { // Loop through all the differences...

    // If it's not a wemo_motion
    if(diff[i].kind == 'E') { // Kind 'E' means edited.

      switch(true) { 

        case diff[i].path && diff[i].path.join('-').match(/state/g) != null: // The WeMo device's state was changed

          var rhs = (diff[i].rhs > 1) ? 1 : (diff[i].rhs < 0) ? 0 : diff[i].rhs; // Anything > 0 is a one, anything < 0 is a zero...

          // Set the device's state
          if(self.name != "wemo_motion") {

            self.wemoDevice.setBinaryState(rhs.toString(), function(error, result) {

            // !!! Note Belkin requires a string for some stupid reason. !!! //
              
              // Update the status, which will push the changes to firebase
              (error != null) ? updateStatus(1, error) : updateStatus(0, result);

            });
          }
          else {
            updateStatus(0, "Motion Detection Successful...");
          }
          break;

        default:
          updateStatus(0, "Successfully Updated");
          break;

     } // End switch block

    } // End if block

  } // End for loop

} // End onFirebaseData()


/**
 * @todo
 */
BelkinWemo.prototype.setSchedule = function (day, hour, minute, onOff, intensity) {

} // End setSchedule()


// *********************** EXPORT THE MODULE! ***********************
module.exports = BelkinWemo;