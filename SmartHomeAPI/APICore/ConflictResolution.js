"use strict"

var ConflictResolution = function () {

  var lastUsersObj = {};

  Object.defineProperty(this, "resolve",
    {
      value: function (usersObj, userSetting, currentSettings) {

        // Pre-State
        if(lastUsersObj == {} || Object.keys(lastUsersObj) == 0) lastUsersObj = usersObj;

        // DO SOMETHING...

        // Return the currentSettings,
        // Modified currentSettings,
        // or the user's settings...
        var newSetting = userSetting;
        var message = "message";

        // Post-State
        lastUsersObj = usersObj;

        return { setting: newSetting, msg: message }
      },
      configurable: false,
      writable: false,
      enumerable: false,
    }
  );

}

module.exports = new ConflictResolution();