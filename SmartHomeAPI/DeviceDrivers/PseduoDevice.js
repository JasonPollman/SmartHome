"use strict"

/**
 * Philips Hue v1.0 API
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
var console = require('../APICore/APIUtil.js').console;

// A great module for making easy requests:
var request = require('request');

// We must delete device cache so that we get a new copy of the BaseDeviceClass
delete require.cache[require.resolve("../APICore/BaseDeviceClass.js")];

// *** Inherit from the BaseDeviceClass ***
var PseudoDevice = require("../APICore/BaseDeviceClass.js");

// Must include driver's details!
// This defines the information used by the API to store/retrieve drivers.
// Will throw an error if non-existent.
PseudoDevice.driverDetails = {
  make    : "Pseduo",        // REQUIRED
  model   : "Device",            // REQUIRED
  version : "1.0.0",          // REQUIRED
  type    : "pseduo",       // REQUIRED
}


// Must include driver's keywords!
// This defines the information used by the API to pair drivers to devices.
// Will throw an error if non-existent.
PseudoDevice.driverKeywords = [
  "lanner electronics"
]

// Tell the API that these devices can be discovered by the driver...
PseudoDevice.discoverable = true;


/**
 * Discover Hue Devices
 * @param cb - The callback that will get executed when the device is discovered,
 *             you must pass back an object with the following keys:
 *                - address
 *                - name
 *                - port
 *             ...in order for the device to be paired correctly.
 */
PseudoDevice.discover = function (driver, cb) {

    var deviceInfo = {
      address: "10.39.223.255",
      port: "N/A",
      name: "lanner_electronics"
    }

    if(cb instanceof Function) cb.call(null, driver, deviceInfo);

} // End PhilipsHue.discover()


/**
 * Sets the settings in the devices: "device_data/[MAC]/settings" firebase object.
 */
PseudoDevice.prototype.setSettings = function (cb) {

  var self = this;

  self.settings = {
    test1: "Test 1",
    test2: "Test 2"
  }

  if(cb instanceof Function) cb.call(self);

} // End setSettings()

// The constructor for this device is setSettings()!
PseudoDevice.prototype.construct = PseudoDevice.prototype.setSettings;


PseudoDevice.prototype.onFirebaseData = function (diff, data, lastState, updateStatus) {
  
  updateStatus(0, "Success");

} // End onFirebaseData()


/**
 * Used by the API to ensure that the actual device can connect using this API
 */
PseudoDevice.prototype.connect = function () {
  
} // End connect()

/**
 * @todo
 */
PseudoDevice.prototype.setSchedule = function (day, hour, minute, onOff, intensity) {

} // End setSchedule()


// *********************** EXPORT THE MODULE! ***********************
module.exports = PseudoDevice;