"use strict"

// Ohhh, pretty colors...
var console = require('../APICore/APIUtil.js').console;

// Create a new device and inherit from the BaseDeviceClass
delete require.cache[require.resolve("../APICore/BaseDeviceClass.js")];
var PhilipsHue = require("../APICore/BaseDeviceClass.js");


// Must include driver's details!
PhilipsHue.driverDetails = {
  make    : "Philips",
  model   : "Hue",
  version : "1.1.0",
  type    : "lighting",
}


// Set all device settings here.
PhilipsHue.prototype.settings = {

  // We would want to check the device for each of these...
  name  : "jason",
  test  : "test value 1",
  test2 : 'test value 2'

}

// When a "setting" is changed in firebase, we handle the change here.
PhilipsHue.prototype.onFirebaseData = function (data) {

  // Create some logic here to implement the data state changes
  // You can use this.lastState to compare these values, to the values previously in memory...

  // Now, set the firebase status based on the logic
  this.updateStatus(0); // -1 = pending, 0 = complete (success), 1 = failure

}


PhilipsHue.prototype.connect = function (requestID, path) {

} // End connect()


PhilipsHue.prototype.setBrightness = function () {

} // End setBrightness()


PhilipsHue.prototype.setLightsOnOff = function () {

} // End setLightsOnOff()


// EXPORT THE MODULE!
module.exports = PhilipsHue;
