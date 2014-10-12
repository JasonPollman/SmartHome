(function() {

  var forever = require("forever"); // The forever module @see npm forever

  // Run the API with forever, so that in the event of an error, the API will restart...
  var child = new (forever.Monitor)('./APICore/SmartHomeAPI.js', {
    silent: false,  // Print to the stdout
    max: 7,         // The maximum times the API will restart before completely failing...
    options: []
  });

  child.start();

})();

