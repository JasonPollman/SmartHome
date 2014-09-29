"use strict"

var APIConfig = require('./APIConfig');
var Conflict  = require('./ConflictResolution.js');

var console   = require('./APIUtil.js').console;
var cap       = require('./APIUtil').cap;

var Firebase  = require("firebase");
var Devices   = {};

var DriverIDs = -1;

var Users = {};

if(!Object.setEqual) {
    Object.defineProperty(Object.prototype, "setEqual", {
    value: function (obj) { for(var i in obj) this[i] = obj[i]; },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

// The last "non-conflict" change was made by user:
var lastSuccessfulChangeUserName;

// The base device object... to be inherited
var BaseDeviceObject = function (name, address, mac) {

  var name    = name;
  var address = address;
  var mac     = mac;

  var self = this;

  if(!name)     throw new Error("Parameter 'name' is a required argument."  );
  if(!address)  throw new Error("Parameter 'address' is a required argument.");
  if(!mac)      throw new Error("Parameter 'mac' is a required argument.");

  if(!Devices[mac]) Devices[mac] = this;
  
  Object.defineProperty(this, "id",
    {
      value: mac,
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "name",
    {
      value: name.toLowerCase().replace(/[^a-z0-9_]|\s+/g, '_'),
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "address",
    {
      value: address,
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "mac",
    {
      value: mac,
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "toString",
    {
      value: function () {
        return "Device (ID:" + this.id + ")\n   Name: " + this.name + "\n   Local Address: " + this.address + "\n   MAC: " + this.mac;
      },
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "firebase",
    {
      value: new Firebase(APIConfig.general.firebaseRootURI + '/' + APIConfig.general.firebaseDevicePath + '/' + this.mac + '/settings'),
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "firebaseUsers",
    {
      value: new Firebase(APIConfig.general.firebaseRootURI + '/' + APIConfig.general.firebaseUserPath),
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "firebaseUsersURI",
    {
      value: APIConfig.general.firebaseRootURI + '/' + APIConfig.general.firebaseUserPath,
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "users",
    {
      get: function () { return Users; },
    }
  );

  Object.defineProperty(this, "firebaseURI",
    {
      value: APIConfig.general.firebaseRootURI + '/' + APIConfig.general.firebaseDevicePath + '/' + this.mac,
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "lastState",
    {
      value: {},
      configurable: false,
      writable: true,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "init",
    {
      value: function () {
        self.firebase.parent().update({ name: this.name, address: this.address, mac: this.mac, settings: this.settings });
        this.lastState.setEqual(this.settings);
      },
      configurable: false,
      writable: false,
      enumerable: false,
    }
  );

  Object.defineProperty(this, "updateStatus",
    {
      value: function (status, message) {

        switch(status) { // Switch codes to string
          case -1:
            status = "pending";
            break;
          case 0:
            status = "sucess";
            break;
          case 1:
            status = "error";
            break;
        }

        if(status != "pending" && status != "success" && status != "error") status = "unknown";
        var user = lastSuccessfulChangeUserName;
        self.firebase.parent().update({"last_change": {
          status: status || "unknown",
          message: message || "success",
          timestamp: Date.now(),
          user: user || "native device settings"
        }});

      },
      configurable: false,
      writeable: true,
      enumerable: true,
    }
  );

  function setState(data, user) {

    var d = data;

    // Update the previous state, so we can detect changes...
    for(var i in self.settings) if(d[i]) self.settings[i] = d[i];

    self.firebase.update(self.settings, function (error) {

      if(error) {
        console.log("Firebase Error:\n" + error);
      }
      else {

        var changeStr = ["\n"];

        var changesMade = false;
        for(var i in self.settings) {
          if(self.settings[i] != self.lastState[i]) {
            changeStr.push("   ---> " + (self.lastState[i] ? "~ " + i + " => " : "+ " + i + " => ")  + d[i]);
            changesMade = true;
          }
          if(!self.lastState[i]) {
            changeStr.push("   ---> " + "- " + i + " <= " + self.lastState[i]);
            changesMade = true;
          }
        }

        if(changesMade) console.notice("Firebase Settings State Change for: " + self.toString() + (changeStr.length > 1 ? changeStr.join("\n") : "") + "\n\nMade by user '" + user + "'.\n");

        // Update the "last" state
        self.lastState.setEqual(self.settings);
      }

    });


  } // End setState()

  this.on("ready", function () { // Must wait until the device has been setup...

    self.firebaseUsers.once('value', function (data) {

      Users = data.val();

      for(var i in Users) {

        // If the users doesn't have any settings, give them the current device's settings
        if(!Users[i][APIConfig.general.firebaseUserSettingsPath] || Users[i][APIConfig.general.firebaseUserSettingsPath] == null) {
          Users[i][APIConfig.general.firebaseUserSettingsPath] = {};
        }

        if(!Users[i][APIConfig.general.firebaseUserSettingsPath][self.mac] || [APIConfig.general.firebaseUserSettingsPath][self.mac] == null) {
          Users[i][APIConfig.general.firebaseUserSettingsPath][self.mac] = {};
          Users[i][APIConfig.general.firebaseUserSettingsPath][self.mac].setEqual(self.settings);
        }

        // Update the user's object in Firebase...
        self.firebaseUsers.update(Users);

        var makeChanges = function (userSetting) {

          // The 'this' keyword is bound to the user firebase reference.

          var userSetting = userSetting.val();
          var newSettings = Conflict.resolve(Users, userSetting, self.settings);

          if(newSettings.setting == userSetting) { // The user's settings passed conflict resolution

            lastSuccessfulChangeUserName = this.name();

            self.onFirebaseData(newSettings.setting);
            setState(newSettings.setting, this.name());

          }
          else { // The user's settings we're rejected...

            console.notice("Firebase Settings State Change for: " + self.toString() + "\n\nMade by user '" + this.name() + "' have been rejected due to the conflict:\n\n" + newSettings.msg + "\n");
          }

          this.child("last_request").update({ // Update the user's last_change status...
            status: newSettings.msg,
            timestamp: Date.now(),
          });

        } // End makeChanges()

        var user = self.firebaseUsers.child(i);

        var deviceSettingRef = user
          .ref()
          .child(APIConfig.general.firebaseUserSettingsPath)
          .child(self.mac)
          .on("value", makeChanges.bind(user)); // End .on("value")

      } // End for loop

    }); // End self.firebaseUsers.once('value')

  }); // End this.on("ready")

  // Call the constructor
  this.init();

} // End BaseDeviceObject


// Inherit from the EventEmitter
require('util').inherits(BaseDeviceObject, require('events').EventEmitter);
// Export the module:
module.exports = BaseDeviceObject;