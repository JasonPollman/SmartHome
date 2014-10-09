"use strict"

var cli = require('cli-color');
var fs  = require('fs');

var APIConfig = require('./APIConfig.js');


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

    if(typeof msg == 'string' && !noTimestamp) msg = msg.replace(/\n/g, "\n                        ");
    msg = ((!noTimestamp) ? (module.exports.pad(d.getMonth() + 1, 2) + '/' + module.exports.pad(d.getDate(), 2) + '/' + module.exports.pad(d.getFullYear(), 2) + ' ' + module.exports.pad(d.getHours(), 2) + ":" + module.exports.pad(d.getMinutes(), 2) + ":" + module.exports.pad(d.getSeconds(), 2) + ":" + module.exports.pad(d.getMilliseconds(), 3) + " > ") : "") + msg + '\n';
    
    // Log all messages to file
    fs.writeFile(APIConfig.general.logPath, msg, { flag: 'a', encoding: 'utf-8', mode: "0777" });

    if(APIConfig.general.reporting >= lvl) process.stdout.write(cli.xterm(color || 39)(msg));

}

// Overwrites the global console object, so that we can control stdout formatting:
module.exports.console = {

  log     : function (msg, noTimestamp) { log(msg,  37, noTimestamp, 3); },
  error   : function (msg, noTimestamp) { log(msg, 124, noTimestamp, 1); },
  warn    : function (msg, noTimestamp) { log(msg, 172, noTimestamp, 2); },
  notice  : function (msg, noTimestamp) { log(msg,  37, noTimestamp, 3); },

  clear   : function () {
    process.stdout.write('\u001B[2J\u001B[0;0f');
    if(process.stdout.getWindowSize()[0] > 108) process.stdout.write(cli.xterm(39)("███████╗███╗   ███╗ █████╗ ██████╗ ████████╗    ██╗  ██╗ ██████╗ ███╗   ███╗███████╗     █████╗ ██████╗ ██╗\n██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝    ██║  ██║██╔═══██╗████╗ ████║██╔════╝    ██╔══██╗██╔══██╗██║\n███████╗██╔████╔██║███████║██████╔╝   ██║       ███████║██║   ██║██╔████╔██║█████╗      ███████║██████╔╝██║\n╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║       ██╔══██║██║   ██║██║╚██╔╝██║██╔══╝      ██╔══██║██╔═══╝ ██║\n███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║       ██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗    ██║  ██║██║     ██║\n╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝       ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝     ╚═╝\n\n"));
  
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

module.exports.cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/**
 * Set's two objects equal by iterating through each key.
 */
if(!Object.setEqual) {
    Object.defineProperty(Object.prototype, "setEqual", {
    value: function (obj) { for(var i in obj) this[i] = obj[i]; },
    enumerable: false,
    writable: false,
    configurable: false
  });
}