(function () {

    // Loop through the "device_data" Firebase object
    for(var d in global[DEVICES_GLOBAL]) {

        var device = global[DEVICES_GLOBAL][d];

        $("#my-devices-content").append('<ul data-role="listview" id="my-connected-devices">');

        var connectedDevice =
            '<li class="device-icon-wrapper" id="' + device.mac.replace(/:/ig, '-') + ' ' + device.name.replace(/_/ig, '-') + ' ' + device.address + '">'
            +   '<a data-transition="' + PAGE_TRANSITION_TYPE + '" href="' + DEVICES_PAGE + '?id=' + device.mac + '&name=' + device.name + '">'
            +   '<img src="' + DEVICE_ICON_DIR + "/" + device.name.replace(/_/ig, "-") + '.png" alt="Device ' + UCFirst(device.name.replace(/_/ig, " ")) + '" class="shadowed-close device-icon" />'
            +   '<h3 class="device-icon-text">' + UCFirst(device.name.replace(/_/ig, " ")) + '</h3>'
            +   '<p class="device-info">IPv4 Address: ' + device.address + '</p>'
            +   '<p class="device-info">Device MAC: ' + device.mac + '</p>'
            +   ((device.last_change && device.last_change.user) ? '<p class="device-info">Last Changed by <span class="em">' + UCFirst(device.last_change.user) + '</span></p>' : '')
            +   '</a></li>';

        var unConnectedDevice =
            '<li class="device-icon-wrapper not-connected" id="' + device.mac.replace(/:/ig, '-') + ' ' + device.name.replace(/_/ig, '-') + ' ' + device.address + '">'
            +   '<a data-transition="' + PAGE_TRANSITION_TYPE + '" href="#">'
            +   '<img src="' + DEVICE_ICON_DIR + "/" + device.name.replace(/_/ig, "-") + '.png" alt="Device ' + UCFirst(device.name.replace(/_/ig, " ")) + '" class="shadowed-close device-icon" />'
            +   '<h3 class="device-icon-text">' + UCFirst(device.name.replace(/_/ig, " ")) + '</h3>'
            +   '<p class="device-info not-connected">Not Connected</p>'
            +   '</li>';

        // If the device is connected make the device icon as a link...
        if(global[CONN_DEVICES_GLOBAL][d]) {
            $('#my-connected-devices').append(connectedDevice);
        }
        else { // The device isn't connected gray out the icon...
            $('#my-connected-devices').append(unConnectedDevice);
        }

        $('.device-icon').error(function () {
            $(this).attr("src", DEVICE_ICON_DIR + "/" + DEFAULT_DEVICE_ICON);
            $(this).addClass("default").addClass("no-icon");
        })

    } // End for loop

})();