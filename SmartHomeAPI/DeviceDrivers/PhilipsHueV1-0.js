"use strict"

// Ohhh, pretty colors...
var console = require('../APICore/APIUtil.js').console;

// A great module for making easy requests:
var request = require('request');

// Create a new device and inherit from the BaseDeviceClass

// We must delete device cache so that we get a new copy of the BaseDeviceClass
delete require.cache[require.resolve("../APICore/BaseDeviceClass.js")];

// Inherit from the BaseDeviceClass
var PhilipsHue = require("../APICore/BaseDeviceClass.js");

// Must include driver's details!
PhilipsHue.driverDetails = {
  make    : "Philips",
  model   : "Hue",
  version : "1.0.0",
  type    : "lighting",
}

PhilipsHue.driverKeywords = [
  "philips",
  "hue",
  "lighting",
]


// Set all device settings here.
PhilipsHue.prototype.settings = {

  // We would want to check the device for each of these...
  name  : "jason",
  test  : "test value 1",
  test2 : 'test value 2'

}

// When a "setting" is changed in firebase, we handle the change here.
PhilipsHue.prototype.onFirebaseData = function (data) {

  var self = this;

  // Create some logic here to implement the data state changes
  // You can use this.lastState to compare these values, to the values previously in memory...

  // Now, set the firebase status based on the logic
  self.getLightStatus("2", function (error, status) {

    if(error) {
      console.notice(error);
      return;
    }
    else {
      if(data.name == "jason") { // Some xxx condition
        self.setLightStatus("2", !(status.state.on), function (error, result) { // Flop the on/off value
          
          if(error) {
            this.updateStatus(1, "error");
          }
          else {
            this.updateStatus(0, "success");
          }

        });
      }
    }

  }); // End getLightStatus()

}


PhilipsHue.prototype.paths = function () {

  return {
    api: 'http://' + this.address + '/api',
    user: 'http://' + this.address + '/api/SmartHomeAPI/',
    lights: 'http://' + this.address + '/api/SmartHomeAPI/lights'
  }

} // End PhilipsHue.paths()

PhilipsHue.prototype.connect = function (requestID, path) {
  
  var self = this;

  var options = {
    url: this.paths.api,
    body: JSON.stringify({ devicetype: "SmartHomeAPI", username: "SmartHomeAPI" }),
  }

  var r = request.post(options, function (error, response, body) {

    if(error) {
      console.error("Error: " + self.toString() + "\n\nUnable to connect to device...\n\n" + error);
      return;
    }

    var response = JSON.parse(body);

    for(var i in response) {
      if(response[i].error && response[i].error.type == 101 && response[i].error.description == "link button not pressed") {
        // Ask the user to press the link button...
      }
    }

    request.get(self.paths.lights, function (error, response, body) {
      
      if(error) {
        console.error("Error: " + self.toString() + "\n\nBad GET request to " + self.paths.lights + "...\n\n" + error);
        return;
      }

      self.lights = body;

    });

  });

} // End connect()


PhilipsHue.prototype.setBrightness = function () {

} // End setBrightness()


PhilipsHue.prototype.getLightStatus = function (lightId, cb) {

  if(!lightId && cb && cb instanceof Function) cb.call(self, "Parameter 'lightId' is required.", undefined);

  var self = this;
  var options = { uri: self.paths().lights + '/' + lightId, method: "GET"}

  request(options, function (error, response, body) {
    
    if(error) {
      if(cb && cb instanceof Function) cb.call(self, error, undefined);
    }
    else {
      if(cb && cb instanceof Function) cb.call(self, undefined, JSON.parse(body));
    }

  }); // End request()

} // End PhilipsHue.prototype.getLightStatus()

PhilipsHue.prototype.setLightStatus = function (lightId, onOff, cb) {

  var self = this;

  var options = {
    uri    : self.paths().lights + '/' + lightId + '/state',
    method : "PUT",
    body   : JSON.stringify({ on: ((onOff === true) ? true : false) })
  }

  if(!lightId && !onOff) {
    if(cb && cb instanceof Function) cb.call(self, error, undefined);
  }
  else {
    request(options, function (error, response, body) {
      if(cb && cb instanceof Function) cb.call(self, undefined, JSON.parse(body));
    });
  }

} // End setLightsOnOff()


PhilipsHue.prototype.setSchedule = function (day, hour, minute, onOff, intensity) {

} // End off()


// EXPORT THE MODULE!
module.exports = PhilipsHue;

var x = new PhilipsHue("philips_lighting_bv", "192.168.1.5", "00:17:88:14:C7:78");
x.getLightStatus("2", true);