// Incase we want to make this a non-browser thing, this could be changed to global = global in node. :P
// But in browsers, the global variable is "window"...
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

var FIREBASE_ROOT              = "https://newsmarthometest.firebaseio.com/" + $SH_KEY + "/";

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

var USER                     = null;
var USER_EMAIL				 = null;
var FIREBASE_USER_DIR_ROOT	 = FIREBASE_ROOT + "/users/";
var FIREBASE_USER_DIR_OBJ    = new Firebase(FIREBASE_USER_DIR_ROOT);
var FIREBASE_USER_ROOT       = null;
var FIREBASE_USER_ROOT_OBJ   = null;
var FIREBASE_USER_DATA       = null;
var FIREBASE_USER_DATA_OBJ   = null;
var FIREBASE_USER_STATUS     = null;
var FIREBASE_USER_STATUS_OBJ = null;

var SPLASH_PAGE     = "index.html";
var MY_DEVICES_PAGE = "my-devices.html";
var DEVICES_PAGE    = "devices.html";
var LOGIN_PAGE		= "login.html";

var DEVICE_ICON_DIR         = "img/device-icons";
var DEFAULT_DEVICE_ICON     = "default.png";
var WIDGETS_DIRECTORY       = "widgets";
var USER_COLOR              = "lib/native-droid/css/jquerymobile.nativedroid.color.green.css";

var FRONT_END_DB_LOG = new Firebase(FIREBASE_ROOT + "front-end-log");


var FIREBASES = [
    FIREBASE_OBJ,
    FIREBASE_DEVICE_DATA_OBJ,
    // FIREBASE_CONN_DATA_OBJ,
    FIREBASE_SCHEDULES_OBJ,
    FIREBASE_RULES_OBJ,
    FIREBASE_USER_DATA_OBJ,
    FIREBASE_USER_STATUS_OBJ,
    FIREBASE_USER_ROOT_OBJ
];

global.$SH_SetUser = function (userEmail) {

    USER_EMAIL = userEmail;
    USER = USER_EMAIL.replace(/[^@a-z0-9]/ig, '-');

    FIREBASE_USER_ROOT       = FIREBASE_USER_DIR_ROOT + USER;
    FIREBASE_USER_ROOT_OBJ   = new Firebase(FIREBASE_USER_ROOT);
    FIREBASE_USER_DATA       = FIREBASE_ROOT + "/users/" + USER + "/device_configs/";
    FIREBASE_USER_DATA_OBJ   = new Firebase(FIREBASE_USER_DATA);
    FIREBASE_USER_STATUS     = FIREBASE_ROOT + "/users/" + USER + "/last_request/";
    FIREBASE_USER_STATUS_OBJ = new Firebase(FIREBASE_USER_STATUS);

}; // End $SH_SetUser()


global.$SH_UserLogout = function () {

    USER = null;
    USER_EMAIL = null;

    FIREBASE_USER_ROOT       = null;
    FIREBASE_USER_ROOT_OBJ   = null;
    FIREBASE_USER_DATA       = null;
    FIREBASE_USER_DATA_OBJ   = null;
    FIREBASE_USER_STATUS     = null;
    FIREBASE_USER_STATUS_OBJ = null;

};


// <------------------------------------------- USEFUL METHODS -------------------------------------------> //
// *** NOTE THAT ALL FUNCTIONS ARE PREFIXED WITH '$SH_' TO PREVENT NAMESPACE ISSUES! ***

/**
 * Push all front-end console messages to Firebase...
 */
var oldLog = global.console.log;
console.log = function () {
    oldLog.bind(console)(arguments);
    FRONT_END_DB_LOG.push(arguments);
};

var oldError = global.console.error;
console.error = function () {

    oldError.bind(console)(arguments);

    for(var i in arguments) {

        if(arguments[i] instanceof Error) {
            if(arguments[i].name && arguments[i].message && arguments[i].stack) {
                FRONT_END_DB_LOG.push({
                    name: arguments[i].name,
                    message: arguments[i].message,
                    stack: arguments[i].stack
                });
            }
        }
        else {
            FRONT_END_DB_LOG.push(arguments);
        }

    } // End for loop

};

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

    var UIheader  = $(".ui-header");
    var UIfooter  = $(".ui-footer");
    var UIcontent = $(".ui-content");

    var screen = $.mobile.getScreenHeight(),
        header = UIheader.hasClass("ui-header-fixed") ? UIheader.outerHeight() - 1 : UIheader.outerHeight(),
        footer = UIfooter.hasClass("ui-footer-fixed") ? UIfooter.outerHeight() - 1 : UIfooter.outerHeight(),
        contentCurrent = UIcontent.outerHeight() - UIcontent.height();
    var content = screen - header - footer - contentCurrent;

    UIcontent.each(function () {
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

        var spaceput = "";
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


/**
 * Inject Static Widgets and bind them to fields
 * These will not change device states!
 *
 * @param page      - The page in which we are injecting the widgets.
 * @param params    - The URL query string arguments
 */
function $SH_injectWidgetsStatic(wrapper, staticObj, firebaseObj, deviceMAC, path_key, value_key) {

    $(wrapper).empty();

    var device;

    for (var i in global[DEVICES_GLOBAL]) {
        if (global[DEVICES_GLOBAL][i].mac == deviceMAC) {
            device = global[DEVICES_GLOBAL][i];
        }
    }

    // The device doesn't exist for some reason, even though we iterated through the DEVICES_GLOBAL,
    // this should never happen.
    if (!device)
        throw new Error("Unable to pair device to object. The device " + deviceMAC + " does not exist.");

    // <---------------------- Begin jQuery Widget Injection ---------------------->

    // Grab the device's widgets data:
    FIREBASE_DEVICE_DATA_OBJ.child(device.mac).child("widgets").once("value", function (data) {

        // Grab the widget definitions for this device from the database...
        var widgets = data.val();

        // So we had to do some krazy stuff here to sort the widgets by their "z" value.
        // First, since the widgets are an object, we have to pump the object key and the object into an
        // array, as an array. Then the array could be sorted by a sort function.
        // Then, they are re-converted back into an object for iteration.
        var aWidgets = [];
        for (var q in widgets) {
            aWidgets.push([q, widgets[q]]);
        }

        // Sort the temporary widgets array.
        aWidgets.sort(function (a, b) {

            aZ = a[1].z || 0;
            bZ = b[1].z || 0;

            if (aZ < bZ) return -1;
            if (bZ < aZ) return 1;
            return 0;
        });

        // Turn the widgets array back into an object.
        var sWidgets = {};
        for (var o in aWidgets) sWidgets[aWidgets[o][0]] = aWidgets[o][1];

        // Iterate through all the widgets for DOM injection...
        for (var i in sWidgets) {

            // This is for a color swatch. Not used by all widgets: only those who have a "hue", "sat", and "bri" definition.
            var swatch = {};


            // Ensure we have the proper fields:

            if (!widgets[i].path) {
                throw new Error("A 'path' property is required for widget '" + i + '".');
            }

            if (!widgets[i].type) {
                throw new Error("A 'type' property is required for widget '" + i + '".');
            }

            if (!widgets[i].info) {
                throw new Error("An 'info' property is required for widget '" + i + '".');
            }

            if (!widgets[i].name) {
                throw new Error("A 'name' property is required for widget '" + i + '".');
            }

            // The widget data path (e.g. what data will the widget change in the database?)
            var path = widgets[i].path.split(/\//g); // Split by '/'

            var REF = '';

            if (path.length > 1) {

                for (var n in path) {

                    if (path[n] == '*') {
                        break;
                    }
                    else {
                        REF += "/" + path[n];
                        path[n] = null;
                    }

                } // End for()

            } // End if()

            // Note, this immediately run anonymous function is passed the widget key and the path,
            // so that the key and path can be passed by value and retained for callbacks.
            (function (i, path) {

                // We have to determine if the path is an object or the value itself to be altered:
                var pathRef = (path.length <= 1) ? FIREBASE_USER_DATA_OBJ.child(device.mac) : FIREBASE_USER_DATA_OBJ.child(device.mac + "/" + REF);

                // Grab the data from the pathRef Firebase reference:
                // Note this function is bound with this = i (e.g. the widget key)
                pathRef.once("value", function (data) {

                    // The references we need to change.
                    // For single values this array will hold a single object.
                    var REFS = [];

                    // So we don't get confused about variable names
                    var i = this;

                    var paths = data.val();

                    if (path.length <= 1) { // We have a 'value' to be changed, not an object

                        var obj = {};

                        obj.path = pathRef;
                        obj.delta = 0;
                        obj.title = UCFirst(pathRef.child(path[0]).name());

                        obj.set = path[0]; // REFS[x].set is the value to be changed when the widget changes value!

                        REFS.push(obj);

                    }
                    else {

                        // Loop through each independent path:
                        for (var k in paths) {

                            var obj = {};

                            obj.path = pathRef + "/" + k;
                            obj.delta = k;
                            obj.title = UCFirst(pathRef.name());
                            REFS.push(obj);

                        }

                    } // End if/else block

                    // Loop through all the path references
                    for (var r in REFS) {

                        // Placeholder for the swatches, if applicable
                        swatch[r] = {};

                        if (path.length > 1) { // We have a multi-path widget:

                            for (var x in path) {
                                if (path[x] != null && path[x] != "*" && x != path.length - 1) {
                                    REFS[r].path += "/" + path[x];
                                }
                                if (x == path.length - 1) {
                                    REFS[r].set = path[x]; // REFS[x].set is the value to be changed when the widget changes value!
                                    // In this case, it's the last portion of the path.
                                }
                            }

                        } // End if block

                        REFS[r].path += "/";

                        var collapsed = (r == 0) ? "false" : "true";

                        // Append a container for the widgets, if we haven't done so on a previous iteration
                        if (!$("#" + device.name + "-" + REFS[r].delta).length) {
                            $(wrapper).append('<div data-content-theme="b" data-role="collapsible" data-collapsed="' + collapsed + '" id="' + device.name + "-" + REFS[r].delta + '"></div>');

                            $(wrapper + " #" + device.name + "-" + REFS[r].delta)
                                .append('<h3 class="ui-bar-b">' + REFS[r].title + ((REFS.length > 1) ? " " + REFS[r].delta : "" ) + '</h3>');
                        }


                        // Give the widget a header, and some info.
                        var pathRegExp = new RegExp("(.*" + encodeURIComponent(device.mac) + "\/)(.*)");
                        $(wrapper + " #" + device.name + "-" + REFS[r].delta)
                            .append('<div><div class="pull-right"><select class="widget" name="' + REFS[r].path.replace(pathRegExp, '$2') + REFS[r].set + '" id="enable-' + "widget-" + i + "-" + REFS[r].delta + '" data-role="slider" data-theme="b">' +
                            '<option value="0">Disabled</option>' +
                            '<option value="1">Enabled</option>'  +
                            '</select></div><h3>' + UCFirst(widgets[i].name) + '</h3>' +
                            '<p><i class="fa fa-info"></i>' + widgets[i].info + '</p>' +
                            '<div class="widget-wrapper-' + i + '"></div></div><hr />');

                        // Load the widget from the '/widgets' directory
                        // Note this function is bound to an array [i, r] to maintain the
                        // widget key (i) and widget delta (r)
                        $("#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i).load(WIDGETS_DIRECTORY + "/" + widgets[i].type + ".html", function (data) {

                            var i = this[0];
                            var r = this[1];

                            // Create the object in jQuery Mobile
                            $(wrapper + " #" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i).trigger("create");

                            // Grab the widget, that is, since we overrode the 'this' variable
                            var e = $(wrapper + " #" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i).find("select, input");

                            // Set the widget's HTML attributes
                            $(e).attr("name", i + "-" + REFS[r].delta);
                            $(e).attr("id", "widget-" + i + "-" + REFS[r].delta);
                            $(e).attr("data-highlight", true);
                            $(e).attr("min", widgets[i].min);
                            $(e).attr("max", widgets[i].max);
                            $(e).attr("step", widgets[i].step);

                            $(e).addClass(i + " delta-" + r);
                            $(e).addClass("z-" + widgets[i].z);

                            $(e).change(function () {

                                var i = this[0];
                                var r = this[1];

                                var value = cleanValue($(e).val());

                                firebaseObj.child(staticObj.key).once("value", function (data) {

                                    var i = this[0];
                                    var r = this[1]

                                    var sch = data.val();

                                    if(!sch[value_key]) sch[value_key] = [];
                                    if(!sch[path_key]) sch[path_key] = [];

                                    var schPath = REFS[r].path.split(encodeURIComponent(device.mac))[1].replace(/^\/|\/$/g, '') + "/" + REFS[r].set;
                                    if(schPath.charAt(0) == '/') schPath = schPath.slice(1, schPath.length);

                                    var index = -1;

                                    if(sch[path_key].indexOf(schPath) > -1) {
                                        index = sch[path_key].indexOf(schPath);
                                        sch[path_key][index] = schPath;
                                        sch[value_key][index] = value;
                                    }
                                    else {
                                        sch[path_key].push(schPath);
                                        sch[value_key].push(value);
                                    }

                                    firebaseObj.child(staticObj.key).update(sch);

                                }.bind(this));

                            }.bind([i, r])); // End $(e).change()

                            // The widget has defined itself as part of a swatch
                            if (widgets[i].swatch) swatch[r][i] = $(e);

                            // Set the current value as default slider value...
                            new Firebase(REFS[r].path + REFS[r].set).once("value", function (data) {

                                $(e).val(data.val().toString());

                                if ($(e).attr("data-type") == "range")  $(e).slider({disabled: false}).slider("refresh");
                                if ($(e).attr("data-role") == "slider") $(e).slider({disabled: false}).slider("refresh");
                                if ($(e).attr("data-role") == "selectmenu") $(e).selectmenu("enable").selectmenu("refresh", true);


                                // If we have all three required swatch fields, build the swatch...
                                if (swatch[r].hue && swatch[r].sat && swatch[r].bri)
                                    buildSwatch(swatch[r], wrapper + " #" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i);

                            });

                            var enable = $(wrapper + " #enable-" + "widget-" + i + "-" + REFS[r].delta);

                            // Enable / Disable on load
                            firebaseObj.child(staticObj.key).child(path_key).once("value", function (data) {

                                if(data.val() == null) return;

                                var values = data.val();

                                if(values.indexOf($(enable).attr("name")) > -1) {
                                    $(enable).val(1).trigger("change");

                                    // Set default value as DB value
                                    firebaseObj.child(staticObj.key).child(value_key).once("value", function (data) {

                                        var results = data.val();
                                        var index = values.indexOf($(enable).attr("name"));

                                        if(results[index] != undefined) {
                                            $(e).val(results[index].toString()).trigger("change");
                                            if ($(e).attr("data-type") == "range")  $(e).slider({disabled: false}).slider("refresh");
                                            if ($(e).attr("data-role") == "slider") $(e).slider({disabled: false}).slider("refresh");
                                            if ($(e).attr("data-role") == "selectmenu") $(e).selectmenu().selectmenu("refresh", true);
                                        }
                                    });

                                }
                                else {

                                    $(enable).val(0).slider("refresh");

                                    if ($(e).attr("data-type") == "range")  $(e).slider({disabled: true}).slider("refresh");
                                    if ($(e).attr("data-role") == "slider") $(e).slider({disabled: true}).slider("refresh");
                                    if ($(e).attr("data-role") == "selectmenu") $(e).selectmenu("disable").selectmenu("refresh", true);
                                }
                            });

                            $(enable).change(function () {

                                var e = $(wrapper + " #" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i + ' .widget');

                                if($(enable).val() == 0) { // The widget isn't enabled for this rule/schedule


                                    if ($(e).attr("data-type") == "range")  $(e).slider({disabled: true}).slider("refresh");
                                    if ($(e).attr("data-role") == "slider") $(e).slider({disabled: true}).slider("refresh");
                                    if ($(e).attr("data-role") == "selectmenu") $(e).selectmenu("disable").selectmenu("refresh", true);

                                    // Remove the reference to the rule's/schedule's paths/values
                                    firebaseObj.child(staticObj.key).once("value", function (data) {

                                        var sch = data.val();

                                        if(!sch[path_key]) sch[path_key] = [];
                                        if(!sch[value_key]) sch[value_key] = [];

                                        var index = sch[path_key].indexOf($(enable).attr("name"));
                                        if(index > -1) {
                                            sch[path_key].splice(index, 1);
                                            sch[value_key].splice(index, 1);
                                        }

                                        firebaseObj.child(staticObj.key).update(sch);
                                    });
                                }
                                else { // The widget is enabled for this schedule/rule

                                    if ($(e).attr("data-type") == "range")  $(e).slider({disabled: false}).slider("refresh");
                                    if ($(e).attr("data-role") == "slider") $(e).slider({disabled: false}).slider("refresh");
                                    if ($(e).attr("data-role") == "selectmenu") $(e).selectmenu().selectmenu("refresh", true);

                                    // Remove the reference to the rule's/schedule's paths/values
                                    firebaseObj.child(staticObj.key).once("value", function (data) {

                                        var sch = data.val();

                                        if(!sch[path_key]) sch[path_key] = [];
                                        if(!sch[value_key]) sch[value_key] = [];

                                        if(sch[path_key].indexOf($(enable).attr("name")) == -1) {
                                            sch[path_key].push($(enable).attr("name"));
                                            sch[value_key].push(cleanValue($(e).val()));
                                        }

                                        firebaseObj.child(staticObj.key).update(sch);

                                    });

                                } // End if/else block

                            });

                            $(enable).trigger("change");

                        }.bind([i, r])); // End $.load()


                    } // End for(var r in REFS)

                }.bind(i));

            })(i, path); // End Anon-Function

        } // End for(widgets)

        $(wrapper).trigger("create");

    });

} // End $SH_InjectWidgetsStatic()


/**
 * Not used — DEPRECIATED!
 * Removes motion widgets from the "Target Device" in Rules.
 * However, this was replaced by just removing motion items when the select menu was created...
 * ...which is a bit more intuitive (and safer too).
 */
global.updateTargetSelect = function () {

    var ruleDeviceTarget = $("#rule-target-device");

    ruleDeviceTarget.children().each(function() {

        var option = this;

        FIREBASE_DEVICE_DATA_OBJ.once("value", function (data) {
            var values = data.val();
            for(var i in values) {
                if(i == $(option).val() && values[i].widgets != undefined) {
                    for(var n in values[i].widgets) {
                        if(values[i].widgets[n] && values[i].widgets[n].type && values[i].widgets[n].type == "motion") {
                            $(option).remove();
                        }
                    }
                }
            }
        });

    });

    ruleDeviceTarget.selectmenu("refresh", true);
    $("#rule-source-device").selectmenu("refresh", true);

} // End updateTargetSelect()
