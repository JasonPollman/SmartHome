"use strict"

var APIConfig = require('./APIConfig');
var Conflict  = require('./ConflictResolution.js');

var console   = require('./APIUtil.js').console;
var cap       = require('./APIUtil').cap;

var Firebase  = require("firebase");
var Devices   = {};

var DriverIDs = -1;

var diff      = require("deep-diff").diff;

var UserConfig = require("./Users.js");

// The last "non-conflict" change was made by user:
var lastSuccessfulChangeUserName;

// The last setting for each user...
var lastUserSetting = {}

// The base device object... to be inherited
var BaseDeviceObject = function (name, address, mac, port) {

  var name    = name;           // The device's name
  var address = address;        // The device's IP address
  var mac     = mac;            // The device's MAC address
  var port    = port || "N/A";  // The device's port, if needed (e.g. for WeMo devices)

  // For scoping in callbacks
  var self = this;

  // The following arguments are required, and will throw if not present:
  if(!name)     throw new Error("Parameter 'name' is a required argument."  );
  if(!address)  throw new Error("Parameter 'address' is a required argument.");
  if(!mac)      throw new Error("Parameter 'mac' is a required argument.");


  if(!Devices[mac]) Devices[mac] = this;
  
  // <----------------------------------- DEFINE PROPERTIES AND THEIR OPTIONS ----------------------------------->

  Object.defineProperty(this, "id", // The device's SmartHome API ID
    {
      value: mac,
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "name", // The device's human frienly name
    {
      value: name.toLowerCase().replace(/[^a-z0-9_]|\s+/g, '_'),
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "address", // The device's IPv4 address
    {
      value: address,
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "mac", // The device's MAC address
    {
      value: mac,
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "port", // The device's port
    {
      value: port,
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );


  Object.defineProperty(this, "settings", // The device's settings, to be set by the constructor!
    {
      value: {},
      configurable: false,
      writable: true,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "toString", // The toString() method, called on when outputting information on the device
    {
      value: function () {
        return "Device (ID:" + this.id + ")\n   Name: " + this.name + "\n   Local Address: " + this.address + "\n   MAC: " + this.mac + "\n   Port: " + this.port;
      },
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "firebase", // The device's firebase object, bound to the device's firebase path.
    {
      value: new Firebase(APIConfig.general.firebaseRootURI + '/' + APIConfig.general.firebaseDevicePath + '/' + this.mac + '/settings'),
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "firebaseUsers", // The firebase user's object, bound to the user's firebase path.
    {
      value: new Firebase(APIConfig.general.firebaseRootURI + '/' + APIConfig.general.firebaseUserPath),
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "firebaseURI", // The device's firebase URI
    {
      value: APIConfig.general.firebaseRootURI + '/' + APIConfig.general.firebaseDevicePath + '/' + this.mac,
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "firebaseUsersURI", // The user's firebase URI
    {
      value: APIConfig.general.firebaseRootURI + '/' + APIConfig.general.firebaseUserPath,
      configurable: false,
      writable: false,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "discoverable",
  // If discoverable, then the API will try to use the device's "discover" method to find devices of this type.
    {
      value: false,
      configurable: false,
      writable: true,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "users", // The user's object.
    {
      get: function () { return UserConfig.users; },
    }
  );


  Object.defineProperty(this, "lastState", // The lastState of the device, before new data was received.
    {
      value: {},
      configurable: false,
      writable: true,
      enumerable: true,
    }
  );

  Object.defineProperty(this, "init", // The base constructor
    {
      value: function () {

        // Call the device instance constructor, with the following callback:
        if(this.construct) this.construct.call(this, function () {

          // Update the firebase settings for the device
          self.firebase.parent().update({ name: this.name, address: this.address, mac: this.mac, settings: this.settings });

          // Set the lastState to the initial state
          this.lastState.setEqual(this.settings);

          // Update the user's settings if need be...
          UserConfig.update(self);

          // Emit the "ready" event, signifying that the device is loaded and ready
          self.emit("ready");

        }); // End this.init()

      },
      configurable: false,
      writable: false,
      enumerable: false,
    }
  );

  Object.defineProperty(this, "updateStatus", // Updates the status of the device in firebase with the current device's settings
    {
      value: function (status, message) { // Takes either a string or integer status code...

        if(typeof status == "string") status = status.toLowerCase();

        switch(status) { // Switch codes to string
          case -1:
            status = "pending";
            break;
          case 0:
            status = "success";
            break;
          case 1:
            status = "error";
            break;
        }

        // If it's an unidentified status, then the status is therefore "unknown".
        if(status != "pending" && status != "success" && status != "error") status = "unknown";
        var user = lastSuccessfulChangeUserName;

        // Update the status in firebase
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
  
  /**
   * Private helper function that sets the device's state in firebase
   * @param data - the data from the user that changed a setting
   * @param user - the user object that changed the data
   */
  var setState = function (data, user) {

    var d = data;

    // Update the previous state, so we can detect changes...
    for(var i in self.settings) if(d && d[i]) self.settings[i] = d[i];

    // Update the firebase settings
    self.firebase.update(self.settings, function (error) {

      if(error) { // Print the error silently
        console.notice("Firebase Error:\n" + error);
      }
      else { // No error

        // Holds the changes made by the user
        var changeStr = [];

        var changesMade = false;

        // The difference between the lastState and the setings as a difference array
        // @see the deep-diff module
        var difference = diff(self.lastState, self.settings);

        // Iterate through the differences
        for(var i in difference) {

          // If the difference of the lastState and new state are different (edited)
          if(difference[i].lhs && difference[i].rhs && difference[i].lhs != difference[i].rhs) {
            changeStr.push("   " + difference[i].path.join("/") + " ---> ~ " + difference[i].lhs + " => " + difference[i].rhs);
            changesMade = true;
          }
          else if(!difference[i].lhs) { // If the value doesn't exist in the lastState (new value)
            changeStr.push("   " + difference[i].path.join("/") + " ---> + " + difference[i].rhs);
            changesMade = true;
          }
          else if(!difference[i].rhs) { // If the value doesn't exist in the new state (value deleted)
            changeStr.push("   " + difference[i].path.join("/") + " <--- - " + difference[i].lhs);
            changesMade = true;
          }
        }

        // If changes were made, print them for the user.
        if(changesMade) console.notice("Firebase Settings State Change for: " + self.toString() + "\n\n" + (changeStr.length > 0 ? changeStr.join("\n") : "") + "\n\nMade by user '" + user + "'.\n");

        // Update the "last" state
        self.lastState.setEqual(self.settings);

      } // End if/else block

    }); // End self.firebase.update()

  } // End setState()

   /**
   * Make changes for the device based on conflict resolution
   * @see the APICore/ConflictResolve.js module.
   * @param userSetting - The user's setting for the device
   */
  var makeChanges = function (userSetting) {

    // The 'this' keyword is bound to the user firebase reference.
    var user = this;
    var userSetting = userSetting.val(); // Get the actual firebase values

    // The new settings based on the conflic resolution
    var newSettings = Conflict.resolve(UserConfig.users, userSetting, self.settings);

    if(newSettings.setting == userSetting) { // The user's settings passed conflict resolution

      // The last successful change was made by user:
      lastSuccessfulChangeUserName = user.name();

      // Call the device instance's onFirebaseData method to see how to handle the new data within the device itself,
      // then call the anon-callback below:
      self.onFirebaseData(diff(self.lastState, newSettings.setting), newSettings.setting, self.lastState, function (code, msg) {

        // Update the status of the last request
        self.updateStatus(code, msg);

        // *** Revert the user's settings back if the onFirebaseData method returned an error ***

        if(typeof code === "string") code = code.toLowerCase();
        if(code == "success" || code == 0) { // The onFirebaseData method returned a successful change
          setState(newSettings.setting, user.name());
          lastUserSetting[user.name()] = newSettings.setting;
        }
        else if (lastUserSetting[user.name()]){ // Revert the user's setting back to it's last state...
          user
          .ref()
          .child(APIConfig.general.firebaseUserSettingsPath)
          .child(self.mac)
          .update(lastUserSetting[user.name()]);
        }

        user.child("last_request/device_response").update({ // Update the user's last_change status...
          status: code,
          message: msg,
          timestamp: Date.now(),
        });

      });
      

    }
    else { // The user's settings we're rejected...

      // Notify the end user
      console.notice("Firebase Settings State Change for: " + self.toString() + "\n\nMade by user '" + this.name() + "' have been rejected due to the conflict:\n\n" + newSettings.msg + "\n");
    
    } // End if(newSettings.setting == userSetting)/else

    this.child("last_request").update({ // Update the user's last_change status...
      status: newSettings.msg,
      timestamp: Date.now(),
    });

  } // End makeChanges()


  // Once the device driver is ready, perform the following function:
  this.once("ready", function () { // Must wait until the device has been setup...

    for(var i in UserConfig.users) {

      var user = self.firebaseUsers.child(i);

      // Call the makeChanges() method when the user updates a value in firebase:
      var deviceSettingRef = user
        .ref()
        .child(APIConfig.general.firebaseUserSettingsPath)
        .child(self.mac)
        .on("value", makeChanges.bind(user)); // End .on("value")

    } // End for loop

  }); // End this.on("ready")
  

  // If a new setting is added to the device, add it to each user's setting.
  self.firebase.on("value", function (data) {

    for(var i in UserConfig.users) { // Iterate through the users object

      var user = self.firebaseUsers.child(i);

      // A reference to the device's settings within the current user context:
      var userRef = user
        .child(APIConfig.general.firebaseUserSettingsPath)
        .child(self.mac)
        .once("value", (function (uData) {

          var user = this;

          // The difference between the user's settings and the actual device's settings
          var uDiff = diff(uData.val(), data.val());
          
          for(var n in uDiff) { // Loop through the user's settings for this device

            if(uDiff[n].kind == 'N' && !uDiff[n].lhs) { // If the device contains a *new* value, not in the user's settings:

              // Decide where to stick the new setting in the user's setting

              var path = uDiff[n].path; // The path of the setting, relative to the device's context.
              var obj = {};

              if(uDiff[n].path.length > 1) { // The path isn't a the device settings root.

                var obj = {}
                obj[path.slice(-1)[0]] = uDiff[n].rhs;

                // Update the user's settings with the new value
                user
                  .child(APIConfig.general.firebaseUserSettingsPath)
                  .child(self.mac)
                  .child(path.slice(0, -1).join('/')).update(obj);

              }
              else { // The path is a sub-path of other paths...

                var obj = {}
                obj[path[0]] = uDiff[n].rhs;

                // Update the user's settings with the new value
                user
                  .child(APIConfig.general.firebaseUserSettingsPath)
                  .child(self.mac)
                  .update(obj);

              } // End if(uDiff[n].path.length > 1)

            } // End if(uDiff[n].kind == 'N' && !uDiff[n].lhs)

          } // End for loop

        }).bind(user)); // End userRef.once()

    } // End for(var i in Users)

  }); // End self.firebase.on

  // Call the constructor(s)
  self.on("instantiated", self.init);


} // End BaseDeviceObject


// Inherit from the EventEmitter
require('util').inherits(BaseDeviceObject, require('events').EventEmitter);
// Export the module:
module.exports = BaseDeviceObject;