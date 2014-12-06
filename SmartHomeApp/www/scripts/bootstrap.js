/**
 * SmartHome Bootstrap Process
 * Verifies Firebase & API Connectivity
 */


/**
 * Keep a persistent connection to the back-end... or show an error, otherwise:
 */

global.persistentConnection = function (persist, reset, cb) {

    (reset) ?
        FIREBASE_OBJ.child("api_status").child("sessions").child(global[SESSION_ID_GLOBAL]).child("ping").set("marco", checkConnection) :
        checkConnection();

    function checkConnection() {

        setTimeout(function () {
            FIREBASE_OBJ.child("api_status/sessions/").child(global[SESSION_ID_GLOBAL]).child("ping").once("value", function (data) {

                var connection = false;
                var pageID = $.mobile.activePage.attr("id");
                var pingVal = data.val();

                if (pingVal != "polo") {

                    $(".error-message-content-page").each(function () {
                        $(this).html("The SmartHome Network API is not connected.<br />Please make sure your local SmartHome API is running.");
                    });
                    $("#error-message-" + pageID).trigger("create");
                    $("#error-message-" + pageID).popup("open");

                }
                else {

                    $("#error-message-" + pageID).popup("close");
                    FIREBASE_OBJ.child("api_status").child("sessions").child(global[SESSION_ID_GLOBAL]).child("ping").set("marco");
                    connection = true;
                }

                if (cb) cb.call(null, connection);
                if (!persist) setTimeout(persistentConnection, CONN_PING_INTERVAL);

            });
        }, CONN_PING_INTERVAL/2);
    }

} // End persistentConnection()


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

            setTimeout(function () {

                var params = $SH_GetParameters(window.location.href);
                var redirectTo = (params && params.page) ? params.page + "?" : undefined;

                if(params) {
                    var keys = Object.keys(params);
                    for(var i = 1; i < keys.length; i++) {
                        redirectTo += keys[i] + '=' + params[keys[i]];
                        if(i != keys.length - 1) redirectTo += "&";
                    }
                }

                persistentConnection(false, true);
                $.mobile.changePage(LOGIN_PAGE, { reloadPage: true, transition: PAGE_TRANSITION_TYPE });

            }, 1000);

            this.status = Infinity;

            // Must make this null so the Firebase code below doesn't push anymore once we're bootstrapped.
            // TOOK ME 4 HOURS TO FIGURE THIS OUT, FTW!
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


$(document).on("pagecreate", function () {

    $("#try-again").click(function (e) {

        e.stopPropagation();
        e.preventDefault();

        window.location.href = (window.location.search) ? "index.html" + window.location.search : "index.html";

    });
});

/**
 * On document ready, we'll bootstrap the front-end...
 */
$(document).one("pagecreate", function () {

    // Set the initial state of the Bootstrap message
    Bootstrap.push("Loading SmartHome App...");

    // <------------------ BOOSTRAPPING CONDITIONS ------------------> //

    // Check for Firebase Connection:
    if(!FIREBASE_OBJ) {
        Bootstrap.push("Unable to connect to SmartHome Firebase Server", 1, "Unable to connect to SmartHome Database Server<br />Do you have an internet connection?");
        return;
    }
    else {

        Bootstrap.push("Successfully connected to the SmartHome cloud...");

        var session = global[SESSION_REF_GLOBAL] = FIREBASE_OBJ.child("api_status/sessions").push({ user: USER, started: Date.now(), ping: "marco" }, function (data) {

            global[SESSION_ID_GLOBAL] = session.name();

            persistentConnection(true, true, function (conn) {

                if (!conn) {
                    Bootstrap.push("Error connecting to the SmartHome API!", 1, "The SmartHome Network API is not connected.<br />Please make sure your local SmartHome API is running.");
                    return;
                }

                // Try to pull in some connected devices...
                FIREBASE_OBJ.child("connected_devices").once("value", function (data) {

                    var values = data.val();

                    if (!values) { // We didn't detect any devices...

                        Bootstrap.push("No smart devices detected!");

                    }
                    else { // Network devices detected...

                        Bootstrap.push("Successfully retrieved list of connected network devices...");

                        for (var i in values) {
                            (values[i].supported) ?
                                Bootstrap.push('Found supported device <span class="Bootstrap-device">' + values[i].name + '...</span>') :
                                Bootstrap.push('Found unsupported device <span class="Bootstrap-device">' + values[i].name + '...</span>');

                        } // End for loop

                    } // End if/else block

                }); // End FIREBASE_OBJ.child("connected_devices").once()

                FIREBASE_OBJ.child("users").on("value", function (data) {
                    data = data.val();
                    Bootstrap.push("Loading Users...");
                    global[USERS_GLOBAL] = data || {};
                });

                FIREBASE_OBJ.child("rules").on("value", function (data) {
                    data = data.val();
                    Bootstrap.push("Loading Rules...");
                    global[RULES_GLOBAL] = data || {};
                });

                FIREBASE_OBJ.child("schedules").on("value", function (data) {
                    data = data.val();
                    Bootstrap.push("Loading Schedules...");
                    global[SCHEDULES_GLOBAL] = data || {};
                });

                FIREBASE_OBJ.child("connected_devices").on("value", function (data) {
                    data = data.val();
                    Bootstrap.push("Detecting Connected Devices...");
                    global[CONN_DEVICES_GLOBAL] = data || {};
                });

                FIREBASE_OBJ.child("device_data").on("value", function (data) {
                    data = data.val();
                    Bootstrap.push("Loading Device Settings...");
                    global[DEVICES_GLOBAL] = data || {};
                    Bootstrap.push("SmartHome App Starting...", 0);
                });

            }); // End persistentConnection()

        });

    } // End if/else blo

}); // End $(document).pagecreate()