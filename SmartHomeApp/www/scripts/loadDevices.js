(function () {

    // Loop through the "device_data" Firebase object
    for(var d in global[DEVICES_GLOBAL]) {

        var device = global[DEVICES_GLOBAL][d];

        // If the device is connected make the device icon as a link...
        if(global[CONN_DEVICES_GLOBAL][d]) {
            $("#my-devices-content").append('<div id="' + device.mac.replace(/:/ig, '-')
            + '" class="device-icon-wrapper ' + device.name + ' ' + device.address
            + '"><a data-transition="' + PAGE_TRANSITION_TYPE + '" href="' + DEVICES_PAGE + '?id=' + device.mac + '&name=' + device.name
            + '"><img src="../' + DEVICE_ICON_DIR + "/" + device.name + '.png" alt="Device '
            + UCFirst(device.name.replace(/_/ig, " ")) + '" class="device-icon" />'
            + '<p class="device-icon-text">' + UCFirst(device.name.replace(/_/ig, " ")) + "</p>"
            + '</a></div>');
        }
        else { // The device isn't connected gray out the icon...

            $("#my-devices-content").append('<div id="' + device.mac.replace(/:/ig, '-')
            + '" class="not-connected device-icon-wrapper ' + device.name + ' ' + device.address
            + '"><img src="../' + DEVICE_ICON_DIR + "/" + device.name + '.png" alt="Device '
            + UCFirst(device.name.replace(/_/ig, " ")) + '" class="device-icon" />'
            + '<p class="device-icon-text">' + UCFirst(device.name.replace(/_/ig, " ")) + "</p>"
            + '</div>');
        }

        $('#' + device.mac.replace(/:/ig, '-') + " img").error(function () {
            $(this).attr("src", "../" + DEVICE_ICON_DIR + "/" + DEFAULT_DEVICE_ICON);
            $(this).addClass("default").addClass("no-icon");
        })

    } // End for loop

})();