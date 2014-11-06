"use strict";

var ConflictResolution = function () {

  var lastUsersObject = {};

  Object.defineProperty(this, "resolve",
    {
      value: function (usersObject, userSetting, currentSettings) {


        self.emit("Conflict Resolution", usersObject, userSetting);
        
        // Pre-State
        // Save original state for testing reference
        var preState = usersObject;
        
        // Logic to initialize the object if it is empty
        if(lastUsersObject == {} || Object.keys(lastUsersObject) == 0) lastUsersObject = usersObject;

        // DO SOMETHING...
        // TODO: Conflict Resolution code here.

        // Return the currentSettings,
        // Modified currentSettings,
        // or the user's settings...
        var newSetting = userSetting;
        var message = "message";

        // Post-State
        // Save state to LastUserObject after 
        // conflict resolution logic resolves the issue
        lastUsersObject = usersObject;
        
        //Save post-state for testing reference
        var postState = usersObject;

        return { setting: newSetting, msg: message }
      },
      configurable: false,
      writable: false,
      enumerable: false
    }
  );

};

module.exports = new ConflictResolution();