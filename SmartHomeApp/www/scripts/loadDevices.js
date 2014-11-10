var FIREBASE_DEVICE_CONNECTION_LISTENER;

$(document).on("pageremove", "#my-devices", function () {
    FIREBASE_CONN_DATA_OBJ.off("value", FIREBASE_DEVICE_CONNECTION_LISTENER);
});

$(document).on("pagecreate", "#my-devices", function () {

    FIREBASE_USER_ROOT_OBJ.once("value", function (data) {

        var user = data.val();

        if(!user.settings) {
            user.settings = {};
            if(!user.settings.color) user.settings.color = "green";
        }

        FIREBASE_USER_ROOT_OBJ.update(user);
        $('link[href="' + USER_COLOR + '"]').attr('href','lib/native-droid/css/jquerymobile.nativedroid.color.' + user.settings.color + '.css');
        USER_COLOR = 'lib/native-droid/css/jquerymobile.nativedroid.color.' + user.settings.color + '.css';

        $("#change-color").val(user.settings.color).selectmenu().selectmenu("refresh", true);

        $("#change-color").change(function () {
            $('link[href="' + USER_COLOR + '"]').attr('href','lib/native-droid/css/jquerymobile.nativedroid.color.' + $(this).val() + '.css');
            USER_COLOR = 'lib/native-droid/css/jquerymobile.nativedroid.color.' + $(this).val() + '.css';
            user.settings.color = $(this).val();
            FIREBASE_USER_ROOT_OBJ.update(user);
        });


    });

    // The last state of the device, true = connected, false = not connected.
    var last = {};

    // Append the "my-devices-content" element to the DOM
    $("#my-devices-content").append('<ul data-role="listview" id="my-connected-devices">');

    // Clone it, so we can change it then replace it after the changes, all at once.
    var myConnectedDevices = $("#my-connected-devices").clone();

    // If there's no device data, show that we haven't detected any "smart devices"
    if(!global[DEVICES_GLOBAL] || Object.keys(global[DEVICES_GLOBAL]).length == 0) {
        $("#my-connected-devices").append('<li class="em">No Smart Devices Detected!<img src="img/sad-face.png" /></li>');
    }
    else { // Otherwise, detect if the devices are connected or not, and set an iterval to continually check this...

        FIREBASE_DEVICE_CONNECTION_LISTENER = FIREBASE_CONN_DATA_OBJ.on("value", function (data) {
            detectDevices(data.val() || {});
        })

    } // End If/else block

    /**
     * Determines whether or not a device is connected and changes the icon on the "my devices" page
     * in the device listview.
     */
    function detectDevices (connectedDevices) {

        if(!connectedDevices) connectedDevices = {};

        // Loop through the "device_data" Firebase object
        for (var d in global[DEVICES_GLOBAL]) {

            var device = global[DEVICES_GLOBAL][d];

            // If the device is connected make the device icon as a link...
            if ((!last[d] || last[d] == false) && connectedDevices[d]) {
                connectDevice(device);
                last[d] = true;
            }
            // If not, just show that it's not connected...
            else if ((last[d] == null || last[d] == true) && !connectedDevices[d]) {
                disconnectDevice(device);
                last[d] = false;
            }

        } // End for loop

        // Replace the "#my-devices-content" element with the changes made.
        $("#my-devices-content").html($(myConnectedDevices)).trigger("create");

        $(".device-icon").error(function () {
            $(this).attr("src", "img/device-icons/" + DEFAULT_DEVICE_ICON);
        });

    }


    /**
     * Creates the buttons, images, and links for a connected device.
     * @param device - The device object from Firebase (e.g. /device_data/[device.mac]/)
     */
    function connectDevice(device) {

        var imageSource = (DEVICE_ICON_DIR + "/" + device.name.replace(/_/ig, "-") + '.png');

        var connectedDevice =
            '<li class="device-icon-wrapper" id="' + device.mac.replace(/:/ig, '-') + '" class="' + device.name.replace(/_/ig, '-') + ' ' + device.address + '">'
            + '<a data-transition="' + PAGE_TRANSITION_TYPE + '" href="' + DEVICES_PAGE + '?id=' + device.mac + '&name=' + device.name + '">'
            + '<img src="' + imageSource + '" alt="Device ' + UCFirst(device.name.replace(/_/ig, " ")) + '" class="shadowed-close device-icon" />'
            + '<h3 class="device-icon-text">' + UCFirst(device.name.replace(/_/ig, " ")) + '</h3>'
            + '<p class="device-info">IPv4 Address: ' + device.address + '</p>'
            + '<p class="device-info">Device MAC: ' + device.mac + '</p>'
            + ((device.last_change && device.last_change.user) ? '<p class="device-info">Last Changed by <span class="em">' + UCFirst(device.last_change.user) + '</span></p>' : '')
            + '</a></li>';

        if($(myConnectedDevices).find("#" + device.mac.replace(/:/ig, '-')).length > 0) {
            $(myConnectedDevices).find("#" + device.mac.replace(/:/ig, '-')).replaceWith(connectedDevice);
        }
        else {
            $(myConnectedDevices).append(connectedDevice);
        }

    } // End connectDevice


    /**
     * Creates the buttons, images, and links for a disconnected device.
     * @param device - The device object from Firebase (e.g. /device_data/[device.mac]/)
     */
    function disconnectDevice(device) {

        var imageSource = (DEVICE_ICON_DIR + "/" + device.name.replace(/_/ig, "-") + '.png');

        var unConnectedDevice =
            '<li class="device-icon-wrapper not-connected" id="' + device.mac.replace(/:/ig, '-') + '" class="' + device.name.replace(/_/ig, '-') + ' ' + device.address + '">'
            + '<a data-transition="' + PAGE_TRANSITION_TYPE + '" href="#">'
            + '<img src="'+ imageSource + '" alt="Device ' + UCFirst(device.name.replace(/_/ig, " ")) + '" class="shadowed-close device-icon" />'
            + '<h3 class="device-icon-text">' + UCFirst(device.name.replace(/_/ig, " ")) + '</h3>'
            + '<p class="device-info not-connected">Not Connected</p>'
            + '</li>';

        if($(myConnectedDevices).find("#" + device.mac.replace(/:/ig, '-')).length > 0) {
            $(myConnectedDevices).find("#" + device.mac.replace(/:/ig, '-')).replaceWith(unConnectedDevice);
        }
        else {
            $(myConnectedDevices).append(unConnectedDevice);
        }

    } // End disconnectDevice

}); // End $('#my-devices').on("pageload")

