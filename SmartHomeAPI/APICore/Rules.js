"use strict"

var APIConfig = require('./APIConfig');
var Devices   = require('./SmartHomeAPI').Devices;
var Firebase  = require("firebase");
var console   = require('./APIUtil.js').console;
var getSetD   = require('./APIUtil.js').getSetDescendantProp;
var mark      = require('./APIUtil.js').mark;

var Rules = function () {

  // The firebase URI for the "rules" object
  var firebaseRules = new Firebase(APIConfig.general.firebaseRootURI + '/' + APIConfig.rules.firebaseRulesPath + '/' + APIConfig.rules.firebaseDeviceRulesPath);

  // When a new rule is added, call setRule()
  firebaseRules.on("value", setRule);

  function verifyEnforcement(sourceDeviceSettings) {
    
  }

  function setRule(rules) {

    console.notice("Loading Rules...");

    var rules = rules.val();
    if(!(rules instanceof Object)) return;

    for(var i in rules) {

      var rule = rules[i];
      if(!(rule instanceof Object)) return;
      console.log(rule);

      var sourcePath = rule.source_path.replace(/\//ig, ".");
      var targetPath = rule.target_path.replace(/\//ig, ".");

      mark();
      mark();

      if(rule.enabled) {
        
            (function (rule, sourcePath, targetPath) {
              setInterval(function () {
                if(Devices[rule.target_mac] && Devices[rule.source_mac]) {
                  var valueAtSourcePath = getSetD(Devices[rule.source_mac].settings, sourcePath);
                  console.log(valueAtSourcePath);
                  if(valueAtSourcePath.toString() == rule.source_value.toString()) {
                    console.log("-0------------------------------0-")
                    var x = getSetD(Devices[rule.target_mac].settings, targetPath, rule.target_value);
                    console.log(x);
                    Devices[rule.target_mac].onFirebaseData([
                      {
                        kind: 'E',
                        path: rule.target_path.split('/'),
                        lhs: x,
                       rhs: rule.target_value
                      }
                    ], Devices[rule.target_mac].settings, Devices[rule.target_mac].lastState, Devices[rule.target_mac].updateStatus);
                  }
                }
                }, 1000);
          })(rule, sourcePath, targetPath);
      }

    } // End for loop

    console.notice("Rules Loaded...");

  } // End setRule()

} // End Rules Module

module.exports = new Rules();