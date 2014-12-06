"use strict"

var cli = require('cli-color');
var fs  = require('fs');

var APIConfig = require('./APIConfig.js');
var Firebase  = require('firebase');


/**
 * To implement interfaces in JavaScript... :P
 */
Object.defineProperty(Object.prototype, 'implements', {

  value: function (i) {
    var missing = [];
    for(var n in i) {
      if(i[n] instanceof Function) {
        if(this[n] === undefined || !(this[n] instanceof Function)) missing.push(n);
      }
    }
    
    if(missing.length == 0) return true;
    return missing;
  },

  enumerable: false // So this property isn't looped through...

}); // End Object.defineProperty


// Replaces the console.log function so we can control output formatting:
var log = function(msg, color, noTimestamp, lvl) {

    var d = new Date(Date.now());

    if(typeof msg == 'object') {
      global.console.log(msg);
      return;
    }

    // Log all messages to firebase...
    var APIStatus = new Firebase(APIConfig.general.firebaseRootURI + "/" + APIConfig.general.firebaseAPIStatus);
    APIStatus.update({ status: (msg || "undefined message"), code: ((lvl < 1) ? 1 : 0) });

    if(typeof msg == 'string' && !noTimestamp) msg = msg.replace(/\n/g, "\n                        ");
    msg = ((!noTimestamp) ? (module.exports.pad(d.getMonth() + 1, 2) + '/' + module.exports.pad(d.getDate(), 2) + '/' + module.exports.pad(d.getFullYear(), 2) + ' ' + module.exports.pad(d.getHours(), 2) + ":" + module.exports.pad(d.getMinutes(), 2) + ":" + module.exports.pad(d.getSeconds(), 2) + ":" + module.exports.pad(d.getMilliseconds(), 3) + " > ") : "") + msg + '\n';

    // Log all messages to file
    fs.writeFile(APIConfig.general.logPath, msg, { flag: 'a', encoding: 'utf-8', mode: "0777" }, function (err) {
      if(err) {
        APIConfig.lastError = '"Unable to write to the the SmartHome API Log.\nPlease run this process as an administration (e.g. sudo)."';
        APIConfig.exitWithError = true;
        process.kill(process.pid, "SIGINT");
      }
    });

    process.stdout.write(cli.xterm(color || 39)(msg));

} // End log()

// Overwrites the global console object, so that we can control stdout formatting:
module.exports.console = {

  log     : function (msg, noTimestamp) { log(msg,  37, noTimestamp, 3); },

  error   : function (msg, noTimestamp) { log(msg, 124, noTimestamp, 3); },

  warn    : function (msg, noTimestamp) { log(msg, 172, noTimestamp, 2); },

  notice  : function (msg, noTimestamp, color) { log(msg,  (color || 37), noTimestamp, 3); },

  clear   : function () {
    process.stdout.write('\u001B[2J\u001B[0;0f');
    process.stdout.write(cli.xterm(39)("███████╗███╗   ███╗ █████╗ ██████╗ ████████╗    ██╗  ██╗ ██████╗ ███╗   ███╗███████╗     █████╗ ██████╗ ██╗\n██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝    ██║  ██║██╔═══██╗████╗ ████║██╔════╝    ██╔══██╗██╔══██╗██║\n███████╗██╔████╔██║███████║██████╔╝   ██║       ███████║██║   ██║██╔████╔██║█████╗      ███████║██████╔╝██║\n╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║       ██╔══██║██║   ██║██║╚██╔╝██║██╔══╝      ██╔══██║██╔═══╝ ██║\n███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║       ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗    ██║  ██║██║     ██║\n╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝       ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝\n\n"));
  
  } // End clear()

} // End console object


/**
 * Utility function to pad a string with leading zeroes, with return a string
 * of length 'len' (which includes the string itself)!
 */
module.exports.pad = function (e, len) {
  if(typeof e == 'object' || len > e.length + 36) return e;
  return ("000000000000000000000000000000000000" + e).slice(-len || e.length);
}


/**
 * Capitalize the first letter of a string
 */
module.exports.cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); }


/**
 * Set's two objects equal by iterating through each key.
 * Added to the Object prototype!
 */
if(!Object.setEqual) {

  Object.defineProperty(Object.prototype, "setEqual", {

    value: function (obj) {

      function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
      }

      for(var i in obj) this[i] = clone(obj[i]);
      return this;

    },
    enumerable: false,
    writable: false,
    configurable: false

  }); // End Object.defineProperty

} // End if block


/**
 * Clone an object
 */
if(!Object.cloneThis) {

  Object.defineProperty(Object.prototype, "cloneThis", {

    value: function () { return JSON.parse(JSON.stringify(this)); },

    enumerable: false,
    writable: false,
    configurable: false

  }); // End Object.defineProperty

} // End if block

/**
 * For debugging, print a long line to the screen
 */
module.exports.mark = function (name) { console.log("<-------------------------- MARKER: " + (name || Date.now().toString()).toUpperCase() + " -------------------------->"); }


/**
 * Gets/Sets a descendant property of an object
 */
module.exports.getSetDescendantProp = function (obj, desc, value, delim) {

  var arr = desc ? desc.split(delim || "/") : [];

  while (arr.length && obj) {
    var comp = arr.shift();
    var match = new RegExp("(.+)\\[([0-9]*)\\]").exec(comp);

    // Handle Arrays
    if ((match !== null) && (match.length == 3)) {

      var arrayData = { arrName: match[1], arrIndex: match[2] };

      if (obj[arrayData.arrName] !== undefined) {

        if (value != undefined && arr.length === 0) obj[arrayData.arrName][arrayData.arrIndex] = value;
        obj = obj[arrayData.arrName][arrayData.arrIndex];

      } else {
        obj = undefined;

      } // End if/else block

      continue;

    } // End outer if block

    // Handle Primitive Objects
    if (value != undefined) {
      if (obj[comp] === undefined) obj[comp] = {};
      if (arr.length === 0) obj[comp] = value;
    }

    obj = obj[comp];

  } // End while loop

  return obj;

} // End getSetDescendantProp()