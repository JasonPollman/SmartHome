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

        for(var i in widgets) {

            var swatch = {};

            if(!widgets[i].path) {
                throw new Error("A 'path' property is required for widget '" + i + '".');
            }

            if(!widgets[i].type) {
                throw new Error("A 'type' property is required for widget '" + i + '".');
            }

            if(widgets[i].path.match(/\*/g)) { // Multiple Paths

                var path = widgets[i].path.split(/\//g); // Split by '/'

                var REF  = '';

                for(var n in path) {

                    if (path[n] == '*') {
                        break;
                    }
                    else {
                        REF += "/" + path[n];
                        path[n] = null;
                    }

                } // End inner for loop

                (function (i, path) {

                    var pathRef = FIREBASE_USER_DATA_OBJ.child(device.mac + "/" + REF);

                    FIREBASE_USER_DATA_OBJ.child(device.mac + "/" + REF).once("value", function (data) {

                        var REFS = [];

                        var i = this;

                        var paths = data.val();
                        for (var k in paths) {

                            var obj = {};

                            obj.path = pathRef + "/" + k;
                            obj.delta = k;
                            obj.title = UCFirst(pathRef.name());
                            REFS.push(obj);

                        }

                        for (var r in REFS) {

                            swatch[r] = {};

                            for (var x in path) {
                                if (path[x] != null && path[x] != "*" && x != path.length - 1) {
                                    REFS[r].path += "/" + path[x];
                                }
                                if(x == path.length - 1) {
                                    REFS[r].set = path[x];
                                }
                            }

                            REFS[r].path += "/";

                            $(".widgets-wrapper").append('<div data-role="collapsible-set" class="widget-container" id="widget-' + i + "-" + r + '"></div>');

                            if(!$("#" + device.name + "-" + REFS[r].delta).length) {

                                $('.widgets-wrapper #widget-' + i + "-" + r)
                                    .prepend('<div data-role="collapsible" data-collapsed="true" id="' + device.name + "-" + REFS[r].delta + '"></div>');

                                $("#" + device.name + "-" + REFS[r].delta)
                                    .append('<h3>' + REFS[r].title + " " + REFS[r].delta + '</h3>')
                            }

                            $("#" + device.name + "-" + REFS[r].delta)
                                .append('<label for="' +  device.name + "-" + REFS[r].delta + '-' + i + '">' + UCFirst(REFS[r].set) +'</label>')
                                .append('<div class="widget-wrapper-' + i + '"></div>');

                            $("#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i).load("../widgets/" + widgets[i].type + ".html", function (data) {

                                var i = this[0];
                                var r = this[1];

                                $(".widgets-wrapper").trigger("create");

                                var e_plain = "#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i + ' .widget';
                                var e = $("#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i + ' .widget');

                                $(e).attr("name", i + "-" + REFS[r].delta);
                                $(e).attr("id", "widget-" + i + "-" + REFS[r].delta + '-' + i);
                                $(e).attr("data-highlight", true);
                                $(e).attr("min", widgets[i].min);
                                $(e).attr("max", widgets[i].max);
                                $(e).attr("step", widgets[i].step);
                                $(e).addClass(i + " delta-" + r);

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
                                        var obj = {}
                                        obj[i] = $(this).val();
                                        new Firebase(REFS[r].path).update(obj);
                                    });
                                }


                                if(widgets[i].swatch) swatch[r][i] = $(e);

                                // Set the current value as default slider value...
                                new Firebase(REFS[r].path + i).once("value", function(data) {
                                    $(e).val(data.val().toString());
                                    if($(e).slider) $(e).slider("refresh");
                                    initializeSwatches();
                                });

                                if(swatch[r].hue && swatch[r].sat && swatch[r].bri)
                                    buildSwatch(swatch[r], "#" + device.name + "-" + REFS[r].delta + ' .widget-wrapper-' + i);

                            }.bind([i, r])); // End $.get()


                        } // End for(var r in REFS)




                    }.bind(i));

                    $(".widgets-wrapper").trigger("create");

                })(i, path); // End Anon-Function

            }
            else {

                $(".widgets-wrapper").append('<div class="widget-container" id="widget-' + i + "-" + "0" + '"></div>');

                $(".widgets-wrapper #widget-" + i + "-" + "0").load("../widgets/" + widgets[i].type + ".html", function (data) {

                    var pathRef = FIREBASE_USER_DATA_OBJ.child(device.mac + "/");

                    var i = this;

                    var path = widgets[i].path.split(/\//g); // Split by '/'

                    var e = $(".widgets-wrapper .widget");

                    var e = $(".widgets-wrapper #widget-" + i + "-" + "0 .widget");
                    $(e).attr("name", i);
                    $(e).attr("id", "widget-" + i);
                    $(e).attr("data-highlight", true);
                    $(e).addClass(i);

                    if(widgets[i].min) $(e).attr("min", widgets[i].min);
                    if(widgets[i].max) $(e).attr("max", widgets[i].max);
                    if(widgets[i].max) $(e).attr("max", widgets[i].max);
                    if(widgets[i].step) $(e).attr("step", widgets[i].step);


                    if(!$("#" + device.name).length) {
                        $(".widgets-wrapper")
                            .prepend('<div id="' + device.name + '"></div>');
                    }

                    $("#" + device.name)
                        .append('<label for="' + i +'">' + UCFirst(i) +'</label>')

                    // Set the current value as default slider value...
                    new Firebase(pathRef + "/" + i).once("value", function(data) {
                        $(e).val(data.val().toString()).slider("refresh");
                    });

                    // *** USE .on("slidestop") ON SLIDERS SO THAT  WE DON'T FLOOD THE DEVICES! *** //
                    if($(e).attr("data-type") == "range") {

                        $(e).on("slidestop", function () {
                            var obj = {}
                            obj[i] = $(this).val();
                            new Firebase(pathRef + "/" + path.slice(0, -1).join("/")).update(obj);
                        });

                    }
                    else {
                        $(e).change(function () {
                            var obj = {}
                            obj[i] = $(this).val();
                            new Firebase(pathRef + "/" + path.slice(0, -1).join("/")).update(obj);
                        });
                    }

                    $(".widgets-wrapper #widget-" + i + "-" + "0").trigger("create");

                }.bind(i)); // End $.get()

            } // End for(widgets)

        }


    });

    var swatches = [];
    function buildSwatch(swatch, container) {

        $("<div>").load("../widgets/color-swatch.html", function() {

            $(container).append($(this));

            var swatchElem = this;
            swatches.push({ swatchElement: this, swatchData: swatch });

            for(var i in swatch) {
                $(swatch[i]).on("change", function () {
                    $(swatchElem).find(".color-swatch").css("background-color", "hsl(" + ($(swatch.hue).val()/182.04) + "," + ($(swatch.sat).val()/2.55) + "%," + ($(swatch.bri).val()/2.55) + "%)");
                });
            }

        });

    } // End buildSwatch()


    function initializeSwatches() {
        for(var i in swatches) {
            var swatch = swatches[i].swatchData;
            $(swatches[i].swatchElement).find(".color-swatch").css("background-color", "hsl(" + ($(swatch.hue).val()/182.04) + "," + ($(swatch.sat).val()/2.55) + "%," + ($(swatch.bri).val()/2.55) + "%)");
        }
    }




} // End injectWidgets