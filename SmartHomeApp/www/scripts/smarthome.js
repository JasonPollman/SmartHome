// Incase we want to make this a non-browser thing, this could be changed to global = global in node. :P
var global = window;

// <------------------------------------------- GLOBAL SETTINGS ------------------------------------------> //

var PAGE_TRANSITION_TYPE       = "slide";
var GET_PARAMETERS_GLOBAL_NAME = "$SH_GetParams";

var USERS_GLOBAL        = "$SH_Users";
var RULES_GLOBAL        = "$SH_Rules";
var SCHEDULES_GLOBAL    = "$SH_Schedules";
var DEVICES_GLOBAL      = "$SH_Devices";
var CONN_DEVICES_GLOBAL = "$SH_Conn_Devices";

var CONN_PING_INTERVAL  = 1000; // 1 Second
var LAST_PAGE_GLOBAL    = "$SH_LastPage";
var SESSION_ID_GLOBAL   = "$SH_SESSION_ID";
var SESSION_REF_GLOBAL  = {};

var FIREBASE_ROOT              = "https://smarthometest.firebaseio.com/" + $SH_KEY + "/";

var FIREBASE_OBJ               = new Firebase(FIREBASE_ROOT);
var FIREBASE_DEVICE_DATA       = FIREBASE_ROOT + "device_data";
var FIREBASE_DEVICE_DATA_OBJ   = new Firebase(FIREBASE_DEVICE_DATA);
var FIREBASE_CONN_DATA         = FIREBASE_ROOT + "connected_devices";
var FIREBASE_CONN_DATA_OBJ     = new Firebase(FIREBASE_CONN_DATA);

var FIREBASE_SCHEDULES         = FIREBASE_ROOT + "schedules";
var FIREBASE_SCHEDULES_OBJ     = new Firebase(FIREBASE_SCHEDULES);
var FIREBASE_RULES             = FIREBASE_ROOT + "rules";
var FIREBASE_RULES_OBJ         = new Firebase(FIREBASE_RULES);

var DEVICE_SETTINGS_PATH       = "settings";

var BOOTSTRAP_MSG_ELEMENT      = "#bootstrap-msg";
var BOOTSTRAP_MSG_INTERVAL     = 200; // In MS.
var BOOTSTRAP_PING_TIMEOUT     = 5000;

var USER                     = "jason";
var FIREBASE_USER_ROOT       = FIREBASE_ROOT + "/users/" + USER;
var FIREBASE_USER_ROOT_OBJ   = new Firebase(FIREBASE_USER_ROOT);
var FIREBASE_USER_DATA       = FIREBASE_ROOT + "/users/" + USER + "/device_configs/";
var FIREBASE_USER_DATA_OBJ   = new Firebase(FIREBASE_USER_DATA);
var FIREBASE_USER_STATUS     = FIREBASE_ROOT + "/users/" + USER + "/last_request/";
var FIREBASE_USER_STATUS_OBJ = new Firebase(FIREBASE_USER_STATUS);

var SPLASH_PAGE     = "index.html";
var MY_DEVICES_PAGE = "my-devices.html";
var DEVICES_PAGE    = "devices.html";

var DEVICE_ICON_DIR         = "img/device-icons";
var DEFAULT_DEVICE_ICON     = "default.png";
var WIDGETS_DIRECTORY       = "widgets";
var USER_COLOR              = "lib/native-droid/css/jquerymobile.nativedroid.color.green.css";


var FIREBASES = [
    FIREBASE_OBJ,
    FIREBASE_DEVICE_DATA_OBJ,
    FIREBASE_CONN_DATA_OBJ,
    FIREBASE_SCHEDULES_OBJ,
    FIREBASE_RULES_OBJ,
    FIREBASE_USER_DATA_OBJ,
    FIREBASE_USER_STATUS_OBJ,
    FIREBASE_USER_ROOT_OBJ
]


// <------------------------------------------- USEFUL METHODS -------------------------------------------> //
// *** NOTE THAT ALL FUNCTIONS ARE PREFIXED WITH '$SH_' TO PREVENT NAMESPACE ISSUES! ***


/**
 * Gets the URL Search String of A Page
 * @param url - The url to get parameters of
 * @return - The list of requested parameters, or if you pass multiple strings, the parameters with those names.
 */
global.$SH_GetParameters = function(url) {

    var pageURL     = (!url) ? window.location.search.substring(1) : url.split(/\?/)[1];

    if(!pageURL) return;

    var vars        = pageURL.split('&');
    var params      = {};

    // The arguments passed to this function, converted into a "real" array...
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    // All GET Query Parameters passed
    var allParams = {};

    // Get all parameters
    for(var i = 0; i < vars.length; i++) {

        var param = vars[i].split('=');

        allParams[param[0]] = param[1];

    } // End for loop

    if(args.length > 0) { // The user has requested specific arguments...

        for(var n = 0; n < args.length; n++) (allParams[args[n]]) ? params[args[n]] = allParams[args[n]] : params[arg[n]] = null;

    }
    else { // The user didn't specify specific params, pass all back...

        params = allParams;

    } // End if/else block

    // If we haven't defined a global yet, do so...
    if((args.length === 0) && (params.length > 0) && !window[GET_PARAMETERS_GLOBAL_NAME] && !url)
        window[GET_PARAMETERS_GLOBAL_NAME] = params;

    // Return an array of requested (or all) parameters
    return params;

}; // End $SH_GetParameters()


/**
 * Cleanup GET parameters... replace '_' with spaces and make parameters title case.
 * @param params - A "params" object
 */
global.$SH_CleanParams = function (params) {

    var clean = {};

    for(var i in params) if(params[i]) clean[i] = UCFirst(params[i].replace(/_/ig, ' '));

    return clean;

}; // End $SH_CleanParams


/**
 * Capitalize the first letter of each word.
 */
global.UCFirst = function (s) {
    return s.replace(/\w\S*/ig, function (str) { return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase(); });
}; // End UCFirst


global.resizeHeight = function () {

    var screen = $.mobile.getScreenHeight(),
        header = $(".ui-header").hasClass("ui-header-fixed") ? $(".ui-header").outerHeight() - 1 : $(".ui-header").outerHeight(),
        footer = $(".ui-footer").hasClass("ui-footer-fixed") ? $(".ui-footer").outerHeight() - 1 : $(".ui-footer").outerHeight(),
        contentCurrent = $(".ui-content").outerHeight() - $(".ui-content").height();
    var content = screen - header - footer - contentCurrent;
    $(".ui-content").each(function () {
        if(!$(this).parent().hasClass("ui-popup")) {
            $(this).height(content);
        }
    });
}; // End resizeHeight


/**
 * Capitalize the first letter of the first word in each sentence.
 * @param string - The string to convert to sentence case.
 * @returns {string}
 */
global.sentenceCase = function (string) {

    var n = string.split(".");
    var vfinal = "";

    for(var i = 0; i < n.length; i++) {

        var spaceput = ""
        var spaceCount = n[i].replace(/^(\s*).*$/,"$1").length;

        n[i] = n[i].replace(/^\s+/,"");

        var newstring = n[i].charAt(n[i]).toUpperCase() + n[i].slice(1);

        for(var j = 0; j < spaceCount ; j++) spaceput = spaceput + " ";
        vfinal = vfinal + spaceput + newstring + ".";
    }

    vfinal = vfinal.substring(0, vfinal.length - 1);
    return vfinal;

} // End sentanceCase()


/**
 * Builds a color "swatch" so the user can see the results of the values changed.
 * @param swatch    - The "swatch" object
 * @param container - The container the "swatch" object will be appended to.
 */
global.buildSwatch = function (swatch, container) {

    // Load the swatch widget
    $("<div>").load(WIDGETS_DIRECTORY + "/color-swatch.html", function () {

        $(container).append($(this));

        var swatchElem = this;

        for (var i in swatch) { // Set the swatches background color

            $(this).find(".color-swatch").css("background-color", "hsl(" + ($(swatch.hue).val() / 182.04) + "," + ($(swatch.sat).val() / 2.55) + "%," + ($(swatch.bri).val() / 5.1) + "%)");


            // Change the background color on slider:
            $(swatch[i]).on("change", function () {
                $(swatchElem).find(".color-swatch").css("background-color", "hsl(" + ($(swatch.hue).val() / 182.04) + "," + ($(swatch.sat).val() / 2.55) + "%," + ($(swatch.bri).val() / 5.1) + "%)");
            });
        }

    });

} // End buildSwatch()


/**
 * Cleans form input values for Firebase insertion for device values
 */
function cleanValue (value) {
    return ($.isNumeric(value)) ? Number(value) : (value === "true") ? Boolean(true) : (value === "false") ? Boolean(false) : value;
}


/**
 * Pad strings or numbers...
 */
Object.defineProperty(

    Object.prototype,
    "padded",

    {
        configurable : false,
        enumerable   : false,
        writable     : false,

        value        : function (length) {

            return ((!(this instanceof String) && !(this instanceof Number)) || length < this.length) ?

                this :

                (function () {

                    var zeros = "";
                    for(var i = 0; i < length; i++) zeros += "0";
                    return (zeros + this.toString()).slice(-length || this.length);

                }.bind(this))();

        }
    }

); // End Definition
