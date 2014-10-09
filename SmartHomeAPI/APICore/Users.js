// Keep the Users object consistent among device drivers... since we clear the driver's base module cache for each driver.
// This value will stay cached in Node...

var APIConfig = require('./APIConfig');
var console   = require('./APIUtil.js').console;
var Firebase  = require("firebase");

var UserConfig = function () {

  var Users = {};

  var UsersFirebase = new Firebase(APIConfig.general.firebaseRootURI + '/' + APIConfig.general.firebaseUserPath);

  UsersFirebase.once("value", function (usersData) {
    Users = usersData.val();
  })

  UsersFirebase.on("child_changed", function (child) {
    var childData = child.val();
    Users[child.name()] = childData;
  });

  UsersFirebase.on("child_removed", function (child) {
    delete Users[child.name()];
  });

  Object.defineProperty(this, "users", // The Users object
    {
      get: function () { return Users; },
      configurable: false,
      enumerable: true,

    }
  ); // End Object.defineProperty

  Object.defineProperty(this, "update", // The Users object
    {
      value: function (device) {

        UsersFirebase.on("child_added", function (child) {

          var childData = child.val();
          if(!childData[APIConfig.general.firebaseUserSettingsPath]) childData[APIConfig.general.firebaseUserSettingsPath] = {};

          if(!childData[APIConfig.general.firebaseUserSettingsPath][device.mac]) {
            childData[APIConfig.general.firebaseUserSettingsPath][device.mac] = {};
            childData[APIConfig.general.firebaseUserSettingsPath][device.mac].setEqual(device.settings);
          }

          Users[child.name()] = childData;
          UsersFirebase.update(Users);

        }); // End UserFirebase.on()

      }, // End value()

      configurable: false,
      writable: false,
      enumerable: true,

    }); // End Object.defineProperty


} // End UserConfig

require('util').inherits(UserConfig, require('events').EventEmitter);
module.exports = new UserConfig;