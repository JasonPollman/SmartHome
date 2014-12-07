"use strict"

var APIConfig = require('./APIConfig');
var Devices   = require('./Devices');
var Firebase  = require("firebase");
var console   = require('./APIUtil.js').console;
var getSetD   = require('./APIUtil.js').getSetDescendantProp;
var mark      = require('./APIUtil.js').mark;
var diff      = require("deep-diff").diff;

var Rules = function () {

  var self = this;

  // Will hold all rules...
  var Rules = {};

  // The firebase URI for the "rules" object
  var firebaseRules = new Firebase(APIConfig.general.firebaseRootURI + '/' + APIConfig.rules.firebaseRulesPath + '/' + APIConfig.rules.firebaseDeviceRulesPath);

  // When a new rule is added, call setRule()
  console.notice("Loading Device Rules...");

  // Add a new rule to the Rules Object when a new rule is added in firebase...
  firebaseRules.on("child_added", setRule);

  // Change a rule locally 
  firebaseRules.on("child_changed", setRule);

  firebaseRules.on("child_removed", function (data) {
    delete Rules[data.name()];
  });

  console.notice("Rules loading complete...");
  self.emit("ready");

  /**
   * When a user changes a setting, if that setting matches a rule, implement the rule.
   * @param sourceDevice - The device calling this method.
   */
  self.verifyEnforcement = function (sourceDevice, lastStateCurrentDifference) {

    if(!sourceDevice && !lastStateCurrentDifference) return;

    // Iterate through the rules, and check to see if any rule should be enforced.
    rulesloop: for(var i in Rules) {

      var rule = Rules[i];

      // To stop rules from overriding each other, make sure the settings just modified are in the source paths...
      for(var k in lastStateCurrentDifference) {

        if(lastStateCurrentDifference[k].kind.toUpperCase() == "E") {

          var diffPaths = [];
          diffPaths.setEqual(lastStateCurrentDifference[k]);
          diffPaths = diffPaths.path.join('/');

          if(rule.source_path.indexOf(diffPaths) < 0) {
            continue rulesloop;
          }
          
        }

      } // End for loop     

      if(rule.enabled == true) { // Only implement a rule if it is set to "enabled"

        if(rule.source_mac == sourceDevice.mac) { // Only implement rules for this device

          if(!Devices[rule.target_mac]) { // Ensure that the target device is connected to the network

            console.warn("The target device for rule '" + i + "' doesn't exist or is not connected.\nThis rule will be ignored.");
            firebaseRules.child(i).child("status").update({ code: 1, message: "Error: Target Device does not exits or is not connected.", timestamp: Date.now() });
            return;

          }
          else { // The target device is connected and reachable...

            // Clone the source device's settings
            var sourceDeviceSettingsClone = {};
            sourceDeviceSettingsClone.setEqual(Devices[rule.source_mac].settings);

            // Clone the target device's settings
            var targetDeviceSettingsClone = {}
            targetDeviceSettingsClone.setEqual(Devices[rule.target_mac].settings);
            
            var sourcePath = []; var targetPath = [];
            for(var n in rule.source_path) sourcePath.push(rule.source_path[n]);
            for(var n in rule.target_path) targetPath.push(rule.target_path[n]);

            // Counts the number of matches in the source devices settings.
            // Must equal the number of source_values
            var sourceSettingsMatched = 0;

            for(var n in sourcePath) { // Loop through the paths and see if the source value is equal to the target value:

              // Get the value at the source path
              var valueAtSourcePath = getSetD(sourceDeviceSettingsClone, sourcePath[n]);

              // If the value at the source path is equal to the actual value, we have a match.
              // Increment the number of matches...
              if(valueAtSourcePath == rule.source_value[n]) { sourceSettingsMatched++; }

            } // End for loop

            // If the number of changes is equal to the number of values, 
            if(sourceSettingsMatched >= rule.target_value.length) { 

              // Update the target values in the target settings clone.
              for(var i in targetPath) getSetD(targetDeviceSettingsClone, targetPath[i], rule.target_value[i]);

              // Make the call to tell the driver to change these settings:
              Devices[rule.target_mac].onFirebaseData(

                diff(Devices[rule.target_mac].lastState, targetDeviceSettingsClone),
                targetDeviceSettingsClone,
                Devices[rule.target_mac].lastState,

                function (code, msg) {

                  // Update the status of the last request
                  Devices[rule.target_mac].updateStatus(code, msg, "SmartHome Rules API");

                  // Set the new device's state:
                  Devices[rule.target_mac].setState(targetDeviceSettingsClone, "Rule: \"" + i + "\".");
                  
                } // End anon-function

              ); // End .onFirebaseData()

            } // End if(sourceSettingsMatched >= rule.target_value.length)

          } // End if(!Devices[rule.target_mac])/else block

        } // End if(rule.source_mac == sourceDevice.mac)

      } // End if(rule.enabled)

    } // End for loop
  
  } // End verifyEnforcement()


  /**
   * Sets/updates a rule based on the firebase "rules/[rule name]" settings
   */
  function setRule(rule) {

    var rulesData = rule.val();

    // A rule must match the following field conditions:
    if(rulesData.source_mac                                            &&
       rulesData.target_mac                                            &&
       rulesData.source_path                                           &&
       (rulesData.source_path  instanceof Array)                       &&
       rulesData.target_path                                           &&
       (rulesData.target_path  instanceof Array)                       &&
       rulesData.source_value                                          &&
       (rulesData.source_value instanceof Array)                       &&
       rulesData.target_value                                          &&
       (rulesData.target_value instanceof Array)                       &&
       rulesData.source_path.length  == rulesData.source_value.length  &&
       rulesData.target_path.length  == rulesData.target_value.length  &&
       rulesData.enabled != undefined) {

      Rules[rule.name()] = rulesData;

    }
    else { // Warn the user that they have a malformed rule

      console.warn("Rule '" + rule.name() + "' is missing a required key or is malformed.");

    }

  } // End setRule()

} // End Rules Module


// Inherit from the EventEmitter
require('util').inherits(Rules, require('events').EventEmitter);
// Export the module
module.exports = new Rules();