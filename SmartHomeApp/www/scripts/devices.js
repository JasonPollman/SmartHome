$(document).on("pagecreate", "#device-page", function () { // When the "device" page is inserted into the DOM...

    /**
     * Flow for adding widgets to the "My Devices" page...
     */
    var devicePage = "#device-page";
    var params = $SH_GetParameters($(devicePage).attr("data-url"));

    if (!params.id && !params.value) { // Verify that we have the correct URL parameters...
        $.mobile.changePage("my-devices.html");
        console.log("Missing required URL parameters");
    }
    else { // Pump the page full of widgets...

        injectWidgets(devicePage, params);
    }

}); // End $(document).on("pagecreate")


/**
 * Injects the device page with widgets based on the "widgets"
 * object in the device's firebase path.
 *
 * @param page      - The page in which we are injecting the widgets.
 * @param params    - The URL query string arguments
 */
function injectWidgets(page, params) {

    // Cleanup the parameters, formatting them all pretty like.
    var params = $SH_CleanParams(params);

    // Pair the device based on the parameter "id" (MAC) value
    var device;

    // Match the device to the URL 'id' query string parameter
    for (var i in global[DEVICES_GLOBAL])
        if (i.toUpperCase() == params.id.toUpperCase()) device = global[DEVICES_GLOBAL][i];

    // The device doesn't exist for some reason, even though we iterated through the DEVICES_GLOBAL,
    // this should never happen.
    if (!device)
        throw new Error("Unable to pair device to URL parameters. The device " + params.id + " does not exist.");

    // <---------------------- Begin jQuery Widget Injection ---------------------->

    // Make the page header the device's name
    $(page + " h1.device-name").html(params.name);

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
                            $(".widgets-wrapper").append('<div data-content-theme="b" data-role="collapsible" data-collapsed="' + collapsed + '" id="' + device.name + "-" + REFS[r].delta + '"></div>');

                            $("#" + device.name + "-" + REFS[r].delta)
                                .append('<h3 class="ui-bar-b">' + REFS[r].title + ((REFS.length > 1) ? " " + REFS[r].delta : "" ) + '</h3>');
                        }

                        // Give the widget a header, and some info.
                        $("#" + device.name + "-" + REFS[r].delta)
                            .append('<div><h3>' + UCFirst(widgets[i].name) + '</h3>' +
                            '<p><i class="fa fa-info"></i>' + widgets[i].info + '</p>' +
                            '<div class="widget-wrapper-' + i + '"></div></div><hr />');

                        // Load the widget from the '/widgets' directory
                        // Note this function is bound to an array [i, r] to maintain the
                        // widget key (i) and widget delta (r)
                        console.log(WIDGETS_DIRECTORY + "/" + widgets[i].type + ".html");
                        $("#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i).load(WIDGETS_DIRECTORY + "/" + widgets[i].type + ".html", function (data) {

                            var i = this[0];
                            var r = this[1];

                            // Create the object in jQuery Mobile
                            $("#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i).trigger("create");

                            // Grab the widget, that is, since we overrode the 'this' variable
                            var e = $("#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i + ' .widget');

                            // Set the widget's HTML attributes
                            $(e).attr("name", i + "-" + REFS[r].delta);
                            $(e).attr("id", "widget-" + i + "-" + REFS[r].delta + '-' + i);
                            $(e).attr("data-highlight", true);
                            $(e).attr("min", widgets[i].min);
                            $(e).attr("max", widgets[i].max);
                            $(e).attr("step", widgets[i].step);
                            $(e).addClass(i + " delta-" + r);
                            $(e).addClass("z-" + widgets[i].z);

                            // *** USE .on("slidestop") ON SLIDERS SO THAT  WE DON'T FLOOD THE DEVICES! *** //
                            if ($(e).attr("data-type") == "range") {

                                $(e).on("slidestop", function () {
                                    var obj = {}
                                    var value = $(this).val();
                                    obj[i] = ($.isNumeric(value)) ? Number(value) : (value === "true") ? Boolean(true) : (value === "false") ? Boolean(false) : value;
                                    new Firebase(REFS[r].path).update(obj);
                                });

                            }
                            else { // Not a range slider...

                                $(e).change(function () {

                                    console.log("HERE");

                                    var obj = {};
                                    var value = cleanValue($(this).val());

                                    console.log($(this).val());

                                    obj[REFS[r].set] = value;

                                    new Firebase(REFS[r].path).update(obj, function (error) {

                                        console.log(error + "ERROR");

                                        var err = $("#device-error-message");

                                        // Show popup-error if there was an error updating Firebase
                                        if(status == 1) {
                                            $(err).popup({ autoOpen: false });
                                            $(err).html("Unable to connect to sync data with the SmartHome database. Try again in a few moments.");
                                            $(err).trigger("create");
                                            $(err).popup("open");
                                        }

                                        FIREBASE_USER_STATUS_OBJ.child(device.mac).once("value", function (data) {

                                            var status = data.val();

                                            if(status.device_response && status.device_response.status != 0) { // The device returned an error:

                                                var msg = "Unexpected Error";
                                                if(status.device_response && status.device_response.message) msg = global["sentenceCase"](JSON.stringify(status.device_response.message).replace(/[^a-z0-9\s\._]/ig, " "));

                                                $("#device-error-message-content").html(UCFirst(msg));
                                                $("#device-error-message").trigger("create");
                                                $("#device-error-message").popup("open");

                                                $(document).on("pageshow", function () {
                                                    $("#device-error-message").popup("close");
                                                });
                                            }

                                        });

                                    });

                                }); // End $(e).change()

                            } // End if/else block

                            // The widget has defined itself as part of a swatch
                            if (widgets[i].swatch) swatch[r][i] = $(e);

                            // Set the current value as default value...
                            // Using "on" for 2-way data binding

                            FIREBASES.push(new Firebase(REFS[r].path + REFS[r].set).once("value", function (data) {

                                if(!data.val()) return;

                                $(e).val(data.val().toString()).trigger("change");

                                if ($(e).attr("data-type") == "range") $(e).slider().slider("refresh");
                                if ($(e).attr("data-role") == "slider") {
                                    $(e).slider().slider("refresh");
                                }

                                // If we have all three required swatch fields, build the swatch...
                                if (swatch[r].hue && swatch[r].sat && swatch[r].bri)
                                    buildSwatch(swatch[r], "#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i);

                            }));

                            /**
                             * If the data is changed in the device's Firebase settings, update it client-side as well:
                             */
                            var pathRegExp = RegExp("(.*" + encodeURIComponent(device.mac) + ")(.*)");

                            FIREBASE_DEVICE_DATA_OBJ.child(device.mac + "/settings/" + REFS[r].path.replace(pathRegExp, "$2") + REFS[r].set).on("value", function (data) {
                                console.log($(e).val().toString(), data.val().toString())
                                if($(e).val().toString() !=  data.val().toString()) $(e).val(data.val().toString()).trigger("change");
                            });

                            /**
                             * If the data is changed in the users's Firebase settings, update it client-side as well:
                             */
                            FIREBASES.push(new Firebase(REFS[r].path + REFS[r].set).on("value", function (data) {
                                $(e).val(data.val().toString()).trigger("change");
                            }));

                        }.bind([i, r])); // End $.get()


                    } // End for(var r in REFS)

                }.bind(i));

            })(i, path); // End Anon-Function

        } // End for(widgets)

        $('.widgets-wrapper').trigger("create");
        $('.ui-content').find('.ui-collapsible').trigger("create");


    });

} // End injectWidgets
