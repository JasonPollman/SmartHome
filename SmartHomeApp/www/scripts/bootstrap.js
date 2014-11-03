// Incase we want to make this a non-browser thing, this could be changed to global = global in node. :P
var global = window;

/**
 * SmartHome Bootstrap Process
 * Verifies Firebase & API Connectivity
 */

/**
 * Bootstrap object
 */
var Bootstrap = {

    status   : -1,
    messages: [],

    ready: false,

    // Adds a message to the messages array...
    push: function (msg, status) {

        this.messages.push(msg);

        if(status == 0) {
            this.push("SmartHome App Ready!", Infinity);
        }

        // Rewrite the push function so we don't print any further messages
        if(this.status > -1) this.push = function () {};

        this.status = status;

    } // End Bootstrap.push()

}; // End Bootstrap object


/**
 * Displays boot messages at a regular interval, and continues to push new messages to the output
 * until the boot status is either 1 (error) or 0 (successful boot).
 *
 * This will also ensure that callback functions get their chance to push messages...
 */
var messageInterval = setInterval(function () {

    if(Bootstrap.messages.length > 0) {
        $(BOOTSTRAP_MSG_ELEMENT).html(Bootstrap.messages.shift());
    }
    else {
        Bootstrap.ready = true;
        $.mobile.changePage('pages/' + MY_DEVICES_PAGE);
        clearInterval(messageInterval);
    }

}, BOOTSTRAP_MSG_INTERVAL); // End messageInterval


/**
 * On document ready, we'll verify the following to ensure the SmartHome App is ready...
 */
$(function () {

    // Set the initial state of the Bootstrap message
    Bootstrap.push("Loading SmartHome App...");

    // <------------------ BOOSTRAPPING CONDITIONS ------------------> //

    // Check for Firebase Connection:
    if(!FIREBASE_OBJ) {
        Bootstrap.push("Unable to connect to SmartHome Firebase Server<br />SmartHome cannot continue...", 1)
    }
    else {
        Bootstrap.push("Successfully connected to the SmartHome database...");
    }


    // Make sure the API is running...
    FIREBASE_OBJ.child("api_status").once("value", function (data) {
        var values = data.val();
        if(values.reachable != true) {
            Bootstrap.push("Error connecting to the SmartHome API!<br />SmartHome cannot continue...", 1);
        }
        else {
            Bootstrap.push("Successfully connected to the SmartHome API...");
        }
    });

    // Try to pull in some connected devices...
    FIREBASE_OBJ.child("connected_devices").once("value", function (data) {

        var values = data.val();

        if(!values) { // We didn't detect any devices...

            Bootstrap.push.html("No smart devices detected!", 1);

        }
        else { // Network devices detected...

            Bootstrap.push("Successfully retrieved list of connected network devices...");

            for(var i in values) {
                (values[i].supported) ?
                    Bootstrap.push('Found supported device <span class="Bootstrap-device">' + values[i].name + '...</span>') :
                    Bootstrap.push('Found unsupported device <span class="Bootstrap-device">' + values[i].name + '...</span>') ;

            } // End for loop

        } // End if/else block

        FIREBASE_OBJ.once("value", function (data) {

            data = data.val();

            console.log(data);

            Bootstrap.push("Loading Users...");
            global[USERS_GLOBAL] = data.users;

            Bootstrap.push("Loading Rules...");
            global[RULES_GLOBAL] = data.rules;

            Bootstrap.push("Loading Schedules...");
            global[SCHEDULES_GLOBAL] = data.schedules;

            Bootstrap.push("Loading Device Settings...", 0);
            global[DEVICES_GLOBAL] = data.device_data;
            global[CONN_DEVICES_GLOBAL] = data.connected_devices;

        });

    }); // End FIREBASE_OBJ.child("connected_devices").once()

});