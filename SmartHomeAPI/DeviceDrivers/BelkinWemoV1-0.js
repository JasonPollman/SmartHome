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
var console = require('../APICore/APIUtil.js').console;

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
  make    : "Belkin",        // REQUIRED
  model   : "Wemo",            // REQUIRED
  version : "1.0.0",          // REQUIRED
  type    : "power",       // REQUIRED
}


// Must include driver's keywords!
// This defines the information used by the API to pair drivers to devices.
// Will throw an error if non-existent.
BelkinWemo.driverKeywords = [
  "belkin wemo switch+motion"
]


/**
 * Sets the settings in the devices: "device_data/[MAC]/settings" firebase object.
 */
BelkinWemo.prototype.setSettings = function (cb) {

  // For scoping, inside a callback, the 'this' keyword has changed...
  // now we can use 'self' to refer to this in a callback.
  var self = this;

  var options = {
    method : "GET",
    uri    : "http://" + self.address + "/api/SmartHomeAPI/"
  }

  // Make a request with options...
  this.request(options, function (error, response) {
    (error) ? console.error(error) : self.settings = JSON.parse(response);
    if(cb instanceof Function) cb.call(self);
  });

} // End setSettings()

// The constructor for this device is setSettings()!
BelkinWemo.prototype.construct = BelkinWemo.prototype.setSettings;


/**
 * Make a request to the Hue API.
 * @param options - The request options, must include 'method' and 'uri'.
 * @param cb      - The callback to be executed upon completion.
 */
BelkinWemo.prototype.request = function (options, cb) {

  var self = this;

  // Check that we have a URI and a Method...
  if(!options && !options.uri && !options.method) {
    // If we don't call the callback and pass it the error.
    if(cb && cb instanceof Function) cb.call(self, "Missing options key: 'uri' and 'method' are required.", undefined);
    return;
  }

  // Check that the method is valid...
  if(options.method != "GET" && options.method != "PUT" && options.method != "POST" && options.method != "DELETE") {
    // If not call the callback, with an error.
    if(cb && cb instanceof Function) cb.call(self, "Unauthorized method: '" + options.method + "'.", undefined);
    return;
  }

  // Make a request with the method 'options.method'.
  request[options.method.toLowerCase()](options, function (error, response, body) {

    if(error) { // Call the callback with the error message...
      if(cb && cb instanceof Function) cb.call(self, error, undefined);
    }
    else { // Call the callback with the request body...
      if(cb && cb instanceof Function) cb.call(self, undefined, body);
    }

  }); // End request.method()

} // End this.request()


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

    if(diff[i].kind == 'E') { // Kind 'E' means edited.

      switch(true) { // If it's true execute it... 

        // A specific power state was changed...

        /* //I need to start looking into what's returned to configure with firebase**
        
        case diff[i].path.join("-").match(/lights-(\d+)-state-(.*)/g) != null:

          var requestBody = {};
          requestBody[diff[i].path[3]] = diff[i].rhs;

          var options = {
            method : "PUT",
            uri    : "http://" + self.address + "/api/SmartHomeAPI/lights/" + diff[i].path[1] + "/state",
            body   : JSON.stringify(requestBody)
          }

          // Make a request to change the setting
          this.request(options, function (error, response) {

            if(error) {

              // If there was an error update the status with code 1 ("error") and exit the function.
              // Also, pass the error with the error message.

              updateStatus(1, error); // updateStatus(code, message)
              return;
            }

            // If the device response wasn't an error, update the status as "success" and pass the response.
            (JSON.parse(response)[0].error) ? updateStatus(1, response) : updateStatus(0, response);
        
          }); // End request()

          break;
   */     
        // Next case...

      } // End switch block

    } // End if block

  } // End for loop

} // End onFirebaseData()


/**
 * Used by the API to ensure that the actual device can connect using this API
 */
BelkinWemo.prototype.connect = function () {
  
  var self = this;

  var options = {
    url: 'http://' + self.address + '/api/',
    body: JSON.stringify({ devicetype: "SmartHomeAPI", username: "SmartHomeAPI" }),
  }

  request.post(options, function (error, response, body) {

    if(error) {
      console.error("Error: " + self.toString() + "\n\nUnable to connect to device...\n\n" + error);
      return;
    }

    var response = JSON.parse(body);

    for(var i in response) {
      if(response[i].error && response[i].error.type == 101 && response[i].error.description == "link button not pressed") {
        // @todo Ask the user to press the link button...
      }
    }

  });

} // End connect()

/**
 * @todo
 */
BelkinWemo.prototype.setSchedule = function (day, hour, minute, onOff, intensity) {

} // End setSchedule()


// *********************** EXPORT THE MODULE! ***********************
module.exports = BelkinWemo;