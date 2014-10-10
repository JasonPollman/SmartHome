"use strict"

var APIConfig = require('./APIConfig');
var Devices   = require('./Devices');
var Firebase  = require("firebase");
var console   = require('./APIUtil.js').console;
var getSetD   = require('./APIUtil.js').getSetDescendantProp;
var mark      = require('./APIUtil.js').mark;

var Rules = function () {

  var self = this;

  // Will hold all rules...
  var Rules = {};

  // The firebase URI for the "rules" object
  var firebaseRules = new Firebase(APIConfig.general.firebaseRootURI + '/' + APIConfig.rules.firebaseRulesPath + '/' + APIConfig.rules.firebaseDeviceRulesPath);

  // When a new rule is added, call setRule()
  console.notice("Loading Device Rules...");

  firebaseRules.on("child_added", setRule);

  firebaseRules.on("child_changed", function (data) {
    Rules[data.name()] = data.val();
  });

  firebaseRules.on("child_removed", function (data) {
    delete Rules[data.name()];
  });

  console.notice("Rules loading complete...");

  self.verifyEnforcement = function (sourceDevice) {

    for(var i in Rules) {

      var rule = Rules[i];

      var sourcePath = rule.source_path.replace(/\//ig, ".");
      var targetPath = rule.target_path.replace(/\//ig, ".");

      if(rule.enabled) {
        if(rule.source_mac == sourceDevice.mac) {
          if(!Devices[rule.target_mac]) {
            console.warn("The target device for rule '" + i + "' doesn't exist or is not connected.\nThis rule will be ignored.");
            return;
          }
          else {
            var valueAtSourcePath = getSetD(Devices[rule.source_mac].settings, sourcePath);
            if(valueAtSourcePath.toString() == rule.source_value.toString()) {
              var newTargetSettings = getSetD(Devices[rule.target_mac].settings, targetPath, rule.target_value);
              Devices[rule.target_mac].onFirebaseData(
                [
                  {
                    kind: 'E',
                    path: rule.target_path.split('/'),
                    lhs: newTargetSettings,
                    rhs: rule.target_value
                  }
                ],
                Devices[rule.target_mac].settings,
                Devices[rule.target_mac].lastState,
                Devices[rule.target_mac].updateStatus
              );

              console.notice("Rule '" + i + "' has been enforced!");

            } // End if(valueAtSourcePath.toString() == rule.source_value.toString()) 

          } // End if(!Devices[rule.target_mac])/else block

        } // End if(rule.source_mac == sourceDevice.mac)

      } // End if(rule.enabled)

    } // End for loop
  
  } // End verifyEnforcement()


  function setRule(rule) {

    var rulesData = rule.val();

    if(rulesData.source_mac &&
       rulesData.target_mac &&
       rulesData.source_path &&
       rulesData.target_path &&
       rulesData.source_value &&
       rulesData.target_value &&
       rulesData.enabled) {

      Rules[rule.name()] = rulesData;
    }

  } // End setRule()

} // End Rules Module

// Inherit from the EventEmitter
require('util').inherits(Rules, require('events').EventEmitter);
// Export the module
module.exports = new Rules();