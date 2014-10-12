"use strict"

var APIConfig = require('./APIConfig');
var Devices   = require('./Devices');
var Firebase  = require("firebase");
var console   = require('./APIUtil.js').console;
var getSetD   = require('./APIUtil.js').getSetDescendantProp;
var mark      = require('./APIUtil.js').mark;
var diff      = require("deep-diff").diff;
var getSetD   = require('./APIUtil.js').getSetDescendantProp;

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


  function setSchedule(schedule) {

    var scheduleData = schedule.val();

    if(!Devices[scheduleData.device]) {
      console.warn("The target device for schedule '" + schedule.name() + "' doesn't exist of isn't connected to the network.");
      firebaseSchedules.child(schedule.name()).child("status").update({ code: 1, message: "Error: The device doesn't exist or is not connected.", timestamp: Date.now() });
      return;
    }

    var dontSetIntervalAgain = false;
    if(Schedules[schedule.name()] != undefined) dontSetIntervalAgain = true;

    // A schedule must pass the following field verification:
    if(scheduleData.device                           &&
       (scheduleData.time instanceof Object)         &&
       scheduleData.time.d != null                   &&
       (scheduleData.time.d instanceof Array)        &&
       scheduleData.time.h != null                   &&
       scheduleData.time.m != null                     ) {

      Schedules[schedule.name()] = scheduleData; 

      if(!dontSetIntervalAgain) {

        var deviceSettingsClone = {};
        deviceSettingsClone.setEqual(Devices[scheduleData.device]);

        for(var i in scheduleData.setting_path) {
          // Set the clone settings with the specified schedule settings
          getSetD(deviceSettingsClone, scheduleData.setting_path[i], scheduleData.setting_values[i]);
        }   

        // Set an interval to check the schuedule to see if it is time to implement it.
        setInterval(function () {

          var now = new Date();

          if(Devices[scheduleData.device]                                 && // Check that the device actually exists
             Schedules[schedule.name()].time.d.indexOf(now.getDay()) > -1 && // Check that the schedule is for today
             Schedules[schedule.name()].time.h == now.getHours()          && // Check that it is the current hour
             Schedules[schedule.name()].time.m == now.getMinutes()) {
            console.log(":asdf");
          // fix this...
            Devices[scheduleData.device].onFirebaseData(

              diff(Devices[scheduleData.device].lastState, deviceSettingsClone),
              deviceSettingsClone,
              Devices[scheduleData.device],

              function (code, msg) {

                // Update the status of the last request
                Devices[scheduleData.device].updateStatus(code, msg);

                // Set the new device's state:
                Devices[scheduleData.device].setState(deviceSettingsClone, "Schedule: \"" + schedule.name() + "\".");
                  
              } // End anon-function

            ); // End .onFirebaseData()

          } // End if(Devices[scheduleData.device]...

        }, 60); // Checks every minute!!!, End setInterval()

      } // End if block

      firebaseSchedules.child(schedule.name()).child("status").update({ code: 0, message: "Schedule Set", timestamp: Date.now() });

    }
    else { // Warn the user that they have a malformed schedule
      console.warn("Schedule '" + schedule.name() + "' is missing a required key or is malformed.");
      firebaseSchedules.child(schedule.name()).child("status").update({ code: 1, message: "Error: This schedule is malformed.", timestamp: Date.now() });
    } 

  } // End setSchedule()

} // End Schedules Module

// Inherit from the EventEmitter
require('util').inherits(Schedules, require('events').EventEmitter);
// Export the module
module.exports = new Schedules();