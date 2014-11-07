/**
 * SmartHome Bootstrap Process
 * Verifies Firebase & API Connectivity
 */

/**
 * Bootstrap object
 */
var Bootstrap = {

    status   : -1,
    errorMessage: "",

    // Adds a message to the messages array...
    push: function (msg, status, errorMessage) {

        if(status != undefined) this.status = status;
        if(errorMessage) this.errorMessage = errorMessage;

        $(BOOTSTRAP_MSG_ELEMENT).html(msg);

        if(this.status == 0) {
            $.mobile.changePage(MY_DEVICES_PAGE);
            this.status = Infinity;

            // Must make this null so the Firebase code below doesn't push anymore once we're bootstrapped.
            // TOOK ME 4 HOURS TO FIGURE THIS OUT, FML
            this.push = function () {}

            return;
        }

        if(status == 1) {
            $("#hero").attr("src", "img/loading-img.png");
            $("#error-message").popup({autoOpen: false});
            $("#error-message-content").html(Bootstrap.errorMessage);
            $("#error-message").trigger("create");
            $("#error-message").popup("open");
        }

    } // End Bootstrap.push()

}; // End Bootstrap object

/**
 * On document ready, we'll verify the following to ensure the SmartHome App is ready..document).on("pagecreate", "#loading-page", .
 */
$(document).one("pagecreate", "#loading-page", function () {

    // Set the initial state of the Bootstrap message
    Bootstrap.push("Loading SmartHome App...");

    // <------------------ BOOSTRAPPING CONDITIONS ------------------> //

    // Check for Firebase Connection:
    if(!FIREBASE_OBJ) {
        Bootstrap.push("Unable to connect to SmartHome Firebase Server", 1, "Unable to connect to SmartHome Firebase Server<br />SmartHome cannot continue...");
        return;
    }
    else {
        Bootstrap.push("Successfully connected to the SmartHome database...");
    }


    // Make sure the API is running...
    FIREBASE_OBJ.child("api_status").once("value", function (data) {
        var values = data.val();
        if(values.reachable != true) {
            Bootstrap.push("Error connecting to the SmartHome API!", 1, "The SmartHome Network API is not connected.<br />The SmartHome App Cannot Continue.");
            return;
        }
        else {
            Bootstrap.push("Successfully connected to the SmartHome API...");
        }

        // Try to pull in some connected devices...
        FIREBASE_OBJ.child("connected_devices").once("value", function (data) {

            var values = data.val();

            if(!values) { // We didn't detect any devices...

                Bootstrap.push("No smart devices detected!");

            }
            else { // Network devices detected...

                Bootstrap.push("Successfully retrieved list of connected network devices...");

                for(var i in values) {
                    (values[i].supported) ?
                        Bootstrap.push('Found supported device <span class="Bootstrap-device">' + values[i].name + '...</span>') :
                        Bootstrap.push('Found unsupported device <span class="Bootstrap-device">' + values[i].name + '...</span>') ;

                } // End for loop

            } // End if/else block

            FIREBASE_OBJ.on("value", function (data) {

                data = data.val();

                Bootstrap.push("Loading Users...");
                global[USERS_GLOBAL] = data.users;

                Bootstrap.push("Loading Rules...");
                global[RULES_GLOBAL] = data.rules;

                Bootstrap.push("Loading Schedules...");
                global[SCHEDULES_GLOBAL] = data.schedules;

                Bootstrap.push("Loading Device Settings...");
                global[DEVICES_GLOBAL] = data.device_data;
                global[CONN_DEVICES_GLOBAL] = data.connected_devices;

                Bootstrap.push("SmartHome App Ready!", 0);

            });

        }); // End FIREBASE_OBJ.child("connected_devices").once()

    });

});