/**
 * Flow for adding widgets to the "My Devices" page...
 */
(function () {

    var devicePage = "#device-page";
    var params = $SH_GetParameters($(devicePage).attr("data-url"));

    if(!params.id && !params.value) { // Verify that we have the correct URL parameters...
        throw new Error("Missing required URL parameters");
    }
    else {
        injectWidgets(devicePage, params);
    }

})();


/**
 * Injects the device page with widgets based on the "widgets"
 * object in the device's firebase path.
 *
 * @todo - Comments :(
 */
function injectWidgets(page, params) {

    // Cleanup the parameters
    var params = $SH_CleanParams(params);

    // Pair the device based on the parameter "id" (MAC) value
    var device;

    for(var i in global[DEVICES_GLOBAL])
        if(i.toUpperCase() == params.id.toUpperCase()) device = global[DEVICES_GLOBAL][i];

    if(!device)
        throw new Error("Unable to pair device to URL parameters. The device " + params.id + " does not exist.");

    // Begin jQuery Injection...

    $(page + " h1.device-name").html(params.name);

    FIREBASE_DEVICE_DATA_OBJ.child(device.mac).child("widgets").once("value", function (data) {

        var widgets = data.val();

        var aWidgets = [];
        for(var q in widgets) {
            aWidgets.push([q, widgets[q]]);
        }

        aWidgets.sort(function (a, b) {

            aZ = a[1].z || 0;
            bZ = b[1].z || 0;

            if(aZ < bZ) return -1;
            if(bZ < aZ) return 1;
            return 0;
        });

        var sWidgets = {};
        for(var o in aWidgets) {
            sWidgets[aWidgets[o][0]] = aWidgets[o][1];
        }

        for(var i in sWidgets) {

            var swatch = {};

            if(!widgets[i].path) {
                throw new Error("A 'path' property is required for widget '" + i + '".');
            }

            if(!widgets[i].type) {
                throw new Error("A 'type' property is required for widget '" + i + '".');
            }

            if(!widgets[i].info) {
                throw new Error("An 'info' property is required for widget '" + i + '".');
            }

            if(!widgets[i].name) {
                throw new Error("A 'name' property is required for widget '" + i + '".');
            }

            var path = widgets[i].path.split(/\//g); // Split by '/'

            var REF  = '';

            if(path.length > 1) {
                for(var n in path) {

                    if (path[n] == '*') {
                        break;
                    }
                    else {
                        REF += "/" + path[n];
                        path[n] = null;
                    }

                }
            } // End inner for loop

            (function (i, path) {

                var pathRef = (path.length <= 1) ? FIREBASE_USER_DATA_OBJ.child(device.mac) : FIREBASE_USER_DATA_OBJ.child(device.mac + "/" + REF);

                pathRef.once("value", function (data) {

                    var REFS = [];

                    var i = this;

                    var paths = data.val();

                    if(path.length <= 1) {
                        var obj = {};

                        obj.path = pathRef;
                        obj.delta = 0;
                        obj.title = UCFirst(pathRef.child(path[0]).name());
                        obj.set = path[0];
                        REFS.push(obj);
                    }
                    else {
                        for (var k in paths) {

                            var obj = {};

                            obj.path = pathRef + "/" + k;
                            obj.delta = k;
                            obj.title = UCFirst(pathRef.name());
                            REFS.push(obj);

                        }
                    }

                    for (var r in REFS) {

                        swatch[r] = {};

                        if(path.length > 1) {
                            for (var x in path) {
                                if (path[x] != null && path[x] != "*" && x != path.length - 1) {
                                    REFS[r].path += "/" + path[x];
                                }
                                if(x == path.length - 1) {
                                    REFS[r].set = path[x];
                                }
                            }
                        }

                        REFS[r].path += "/";

                        $(".widgets-wrapper").append('<div class="widget-container" id="widget-' + i + "-" + r + '"></div>');


                        if(!$("#" + device.name + "-" + REFS[r].delta).length) {

                            $('.widgets-wrapper #widget-' + i + "-" + r)
                                .prepend('<div data-content-theme="b" data-role="collapsible" data-collapsed="true" id="' + device.name + "-" + REFS[r].delta + '"></div>');

                            $("#" + device.name + "-" + REFS[r].delta)
                                .append('<h3 class="ui-bar-b">' + REFS[r].title + ((REFS.length > 1) ? " " + REFS[r].delta : "" ) + '</h3>');
                        }

                        $("#" + device.name + "-" + REFS[r].delta)
                            .append('<div></div><h4>' + UCFirst(widgets[i].name) +'</h4>' +
                                '<p><i class="fa fa-info-circle"></i>' + widgets[i].info +'</p>' +
                                '<div class="widget-wrapper-' + i + '"></div></div>');


                        $("#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i).load(WIDGETS_DIRECTORY + "/" + widgets[i].type + ".html", function (data) {

                            var i = this[0];
                            var r = this[1];

                            $("#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i).trigger("create");

                            var e = $("#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i + ' .widget');

                            $(e).attr("name", i + "-" + REFS[r].delta);
                            $(e).attr("id", "widget-" + i + "-" + REFS[r].delta + '-' + i);
                            $(e).attr("data-highlight", true);
                            $(e).attr("min", widgets[i].min);
                            $(e).attr("max", widgets[i].max);
                            $(e).attr("step", widgets[i].step);
                            $(e).addClass(i + " delta-" + r);
                            $(e).addClass("z-" + widgets[i].z);

                            // *** USE .on("slidestop") ON SLIDERS SO THAT  WE DON'T FLOOD THE DEVICES! *** //
                            if($(e).attr("data-type") == "range") {

                                $(e).on("slidestop", function () {
                                    var obj = {}
                                    obj[i] = $(this).val();
                                    new Firebase(REFS[r].path).update(obj);
                                });

                            }
                            else {
                                $(e).change(function () {
                                    var obj = {};
                                    obj[REFS[r].set] = $(this).val();
                                    new Firebase(REFS[r].path).update(obj);
                                });
                            }


                            if(widgets[i].swatch) swatch[r][i] = $(e);

                            // Set the current value as default slider value...
                            // Using "on" for 2-way data binding
                            new Firebase(REFS[r].path + REFS[r].set).once("value", function(data) {
                                $(e).val(data.val().toString());
                                if($(e).attr("data-type") == "range") $(e).slider("refresh");

                                if(swatch[r].hue && swatch[r].sat && swatch[r].bri) {
                                    buildSwatch(swatch[r], "#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i);
                                }
                            });

                            new Firebase(REFS[r].path).on("value", function(data) {
                                var val = data.val();
                                for(var m in val) {
                                    if (m == REFS[r].set) {
                                        $(e).val(val[m]);
                                        if($(e).attr("data-type") == "range") $(e).slider("refresh");
                                    }
                                }
                            });

                        }.bind([i, r])); // End $.get()


                    } // End for(var r in REFS)

                }.bind(i));

            })(i, path); // End Anon-Function

        } // End for(widgets)

    });

    function buildSwatch(swatch, container) {

        $("<div>").load(WIDGETS_DIRECTORY + "/color-swatch.html", function() {

            $(container).append($(this));

            var swatchElem = this;

            for(var i in swatch) {

                $(this).find(".color-swatch").css("background-color", "hsl(" + ($(swatch.hue).val()/182.04) + "," + ($(swatch.sat).val()/2.55) + "%," + ($(swatch.bri).val()/2.55) + "%)");

                $(swatch[i]).on("change", function () {
                    $(swatchElem).find(".color-swatch").css("background-color", "hsl(" + ($(swatch.hue).val()/182.04) + "," + ($(swatch.sat).val()/2.55) + "%," + ($(swatch.bri).val()/2.55) + "%)");
                });
            }

        });

    } // End buildSwatch()


} // End injectWidgets