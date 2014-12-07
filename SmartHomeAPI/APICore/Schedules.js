"use strict"

var APIConfig = require('./APIConfig');
var Devices   = require('./Devices');
var Firebase  = require("firebase");
var console   = require('./APIUtil.js').console;
var getSetD   = require('./APIUtil.js').getSetDescendantProp;
var mark      = require('./APIUtil.js').mark;
var diff      = require("deep-diff").diff;

var SchedulesMod = function () {

  var self = this;

  // Will hold all schedules...
  var Schedules = {};

  // Holds all schedule time intervals per schedule key.
  var ScheduleIntervals = {};

  // The firebase URI for the "schedules" object
  var firebaseSchedules = new Firebase(APIConfig.general.firebaseRootURI + '/' + APIConfig.schedules.firebaseSchedulesPath);

  console.notice("Loading Device Schedules...");

  // When a new schedule is added, call setSchedule()
  firebaseSchedules.on("child_added", setSchedule);
  firebaseSchedules.on("child_changed", setSchedule);

  firebaseSchedules.on("child_removed", function (data) {
    var scheduleKey = data.name();
    delete Schedules[data.name()];
    if(ScheduleIntervals[scheduleKey] != undefined) clearInterval(ScheduleIntervals[scheduleKey]);
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
       scheduleData.time.m != null                   ) {

      // Push the schedule into the Schedules object
      Schedules[schedule.name()] = scheduleData;

      // Set the schedule to be enforced
      self.enforceSchedule(Schedules[schedule.name()], schedule.name());

    }
    else { // Warn the user that they have a malformed schedule

      console.warn("Schedule '" + schedule.name() + "' is missing a required key or is malformed.");

    } // End if/else block

  } // End setSchedule()

  /**
   * Called when a device is initialized and sets an interval for each schedule if the schedule's device exists.
   * @param device - The device calling the method
   */
  this.enforceSchedule = function (schedule, scheduleKey) {

    if(schedule    == undefined) return;
    if(scheduleKey == undefined) return;

    // Clear the interval, if it has been set already
    if(ScheduleIntervals[scheduleKey] != undefined) clearInterval(ScheduleIntervals[scheduleKey]);

    // Set an interval to check the schedule to see if it is time to implement it.
    ScheduleIntervals[scheduleKey] = setInterval(scheduleInterval, 1000); // Checks every second!!!, End setInterval()

    function scheduleInterval() {

      // Grab the time
      var now = new Date();

      if( // If the schedule's time is now...
        schedule.time.d.indexOf(now.getDay()) > -1 && // Check that the schedule is for today
        schedule.time.h == now.getHours()          && // Check that it is the current hour
        schedule.time.m == now.getMinutes()        && // Check that it is the current minute
        now.getSeconds() == 0) {                      // Check that it's the second on the dot...

        if(Devices[schedule.device] == undefined) { // Ensure that the device is connected to the network
          console.warn("The device for schedule '" + scheduleKey + "' doesn't exist or is not connected.\nThis schedule will be ignored.");
          return;
        }

        if(schedule.setting_path == undefined) schedule.setting_path = [];
        if(schedule.setting_value == undefined) schedule.setting_value = [];

        // Grab a cloned copy of the device's settings...
        var deviceSettingsClone = {};
        deviceSettingsClone.setEqual(Devices[schedule.device].settings);

        for(var n in schedule.setting_path) {

          // Set the clone settings with the specified schedule settings
          var x = getSetD(deviceSettingsClone, schedule.setting_path[n], schedule.setting_value[n], "/");

        } // End for loop

        // Change the device's setting:
        Devices[schedule.device].onFirebaseData(

            diff(Devices[schedule.device].lastState, deviceSettingsClone),
            deviceSettingsClone,
            Devices[schedule.device],

            function (code, msg) {

              if (Devices[schedule.device] != undefined &&
                  Devices[schedule.device].updateStatus instanceof Function &&
                  Devices[schedule.device].setState instanceof Function) {

                // Update the status of the last request
                Devices[schedule.device].updateStatus(code, msg, "SmartHome Schedules API");

                // Set the new device's state:
                Devices[schedule.device].setState(deviceSettingsClone, "Schedule: \"" + scheduleKey + "\".");

              }

            } // End anon-function

        ); // End .onFirebaseData()

        console.notice("Schedule '" + scheduleKey + "' implemented.");
        firebaseSchedules.child(scheduleKey).child("status").update({ code: 0, message: "Schedule last enforced @ " + Date.now() + ".", timestamp: Date.now() });

      } // End if(Devices[scheduleData.device]...

    } // End scheduleInterval()

  } // End enforceSchedule()

} // End Schedules Module

// Inherit from the EventEmitter
require('util').inherits(SchedulesMod, require('events').EventEmitter);
// Export the module
module.exports = new SchedulesMod();