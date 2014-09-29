"use strict"

module.exports = {

  devices: {

    driverDirectory    : "DeviceDrivers",
    interfaceDirectory : "DeviceInterfaces",

    packetLossThreshold: 20, // In percent (%)

    scanInterval: 300000 // 5 Minutes in ms.

  }, // End devices

  general: {

    // This app version
    version: '0.1.0',

    // Terminal Output:
    // -----------------------------------------------
    // 0 - Report Nothing to console (will still show up in the server log).
    // 1 - Errors Only.
    // 2 - Errors & Warnings
    // 3 - Report All (Errors, Warnings, and Notices).
    reporting: 3,

    // The salt for encryption/decryption
    salt: "…´ÄÛÔ∑ÛÔcn}.Ëÿí≈P-“&JÒ5ª«j£",

    deviceLoadTimeout: 180000, // 3 Minutes

    requireAuthentication: false,

    firebaseRootURI          : "https://smarthomeapp.firebaseio.com",

    firebaseDevicePath       : "device_data",
    firebaseUserPath         : "users",
    firebaseUserSettingsPath : "device_configs",
    firebaseAllDevicesPath   : "connected_devices",

    logPath: "smarthomelog.log",

  }, // End general

  request: {

    requiredFields: [ "make", "model", "version", "func" ],

  }

} // End module.exports