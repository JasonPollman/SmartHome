"use strict"

var APIConfig = require('./APIConfig');
var Devices   = require('./Devices');
var Firebase  = require("firebase");
var console   = require('./APIUtil.js').console;
var getSetD   = require('./APIUtil.js').getSetDescendantProp;
var mark      = require('./APIUtil.js').mark;
var diff      = require("deep-diff").diff;

var Schedules = function () {

  var self = this;

  // Will hold all schedules...
  var Schedules = {};

  // The firebase URI for the "schedules" object
  var firebaseSchedules = new Firebase(APIConfig.general.firebaseRootURI + '/' + APIConfig.schedules.firebaseSchedulesPath);

  console.notice("Loading Device Schedules...");

  // When a new schedule is added, call setSchedule()
  firebaseSchedules.on("child_added", setSchedule);
  firebaseSchedules.on("child_changed", setSchedule);

  firebaseSchedules.on("child_removed", function (data) {
    delete Schedules[data.name()];
  });

  console.notice("Schedules loading complete...");
  self.emit("ready");


  /**
   * Set a schedule based on firebase values
   * @param schedule - The firbase schedule object
   */
  function setSchedule(schedule) {

    var scheduleData = schedule.val();

    // A schedule must pass the following field verification:
    if(scheduleData.device                           &&
       (scheduleData.time instanceof Object)         &&
       scheduleData.time.d != null                   &&
       (scheduleData.time.d instanceof Array)        &&
       scheduleData.time.h != null                   &&
       scheduleData.time.m != null                   &&
       scheduleData.setting_path                     &&
       scheduleData.setting_value                       ) {

      // Push the schedule into the Schedules object
      Schedules[schedule.name()] = scheduleData; 

    }
    else { // Warn the user that they have a malformed schedule

      console.warn("Schedule '" + schedule.name() + "' is missing a required key or is malformed.");
      firebaseSchedules.child(schedule.name()).child("status").update({ code: 1, message: "Error: This schedule is malformed.", timestamp: Date.now() });

    } // End if/else block

  } // End setSchedule()

  /**
   * Called when a device is initialized and sets an interval for each schedule if the schedule's device exists.
   * @param device - The device calling the method
   */
  this.enforceSchedule = function (device) {

    if(!device && !(typeof device == "object")) return;
    
    for(var i in Schedules) { // Iterate through the scheduels

      if(Schedules[i].device == device.mac) { // If the schedule MAC == the device's MAC

        (function (i) { // Wrap in function so that we can preserve i

          // Set an interval to check the schuedule to see if it is time to implement it.
          setInterval(function () {

            // Grab a cloned copy of the device's settings...
            var deviceSettingsClone = {};
            deviceSettingsClone.setEqual(Devices[device.mac].settings);

            for(var n in Schedules[i].setting_path) {

              // Set the clone settings with the specified schedule settings
              getSetD(deviceSettingsClone, Schedules[i].setting_path[n], Schedules[i].setting_value[n]);

            } // End for loop

            // Grab the time
            var now = new Date();

            if( // If the schedule's time in now (within a minute)

              Schedules[i].time.d.indexOf(now.getDay()) > -1 && // Check that the schedule is for today
              Schedules[i].time.h == now.getHours()          && // Check that it is the current hour
              Schedules[i].time.m == now.getMinutes()) {        // Check that it is the current minute

              console.notice("Schedule '" + i + "' implemented.");
              firebaseSchedules.child(i).child("status").update({ code: 0, message: "Schedule last enforced @ " + Date.now() + ".", timestamp: Date.now() });

              // Change the device's setting:
              Devices[device.mac].onFirebaseData(

                diff(Devices[device.mac].lastState, deviceSettingsClone),
                deviceSettingsClone,
                Devices[device.mac],

                function (code, msg) {

                  // Update the status of the last request
                  Devices[device.mac].updateStatus(code, msg, "SmartHome Schedules API");

                  // Set the new device's state:
                  Devices[device.mac].setState(deviceSettingsClone, "Schedule: \"" + i + "\".");
                    
                } // End anon-function

              ); // End .onFirebaseData()

            } // End if(Devices[scheduleData.device]...

          }, 60000); // Checks every minute!!!, End setInterval()

          firebaseSchedules.child(i).child("status").update({ code: 0, message: "Schedule Set", timestamp: Date.now() });
        
        })(i); // Pass i by value...

      } // End if(Schedules[i].device == Devices[device.mac])

    } // End for loop

  } // End enforceSchedule()

} // End Schedules Module

// Inherit from the EventEmitter
require('util').inherits(Schedules, require('events').EventEmitter);
// Export the module
module.exports = new Schedules();