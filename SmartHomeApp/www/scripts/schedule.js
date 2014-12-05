$(document).on("pagecreate", "#schedule", function () { // When the "device" page is inserted into the DOM...

    /**
     * Flow for adding widgets to the "Schedule" page...
     */
    var params = $SH_GetParameters($(this).attr("data-url"));

    var found = false;

    var schedule;

    if (!params.id && !params.value) { // Verify that we have the correct URL parameters...
        throw new Error("Missing required URL parameters");
    }
    else { // Pump the page full of widgets...

        FIREBASE_SCHEDULES_OBJ.once("value", function (data) {

            var schs = data.val();

            for(var i in schs) {

                if(i == params.id) {

                    found = true;

                    schedule = schs[i];
                    schedule.key = i;

                    // The schedule doesn't exist for some reason, even though we iterated through the SCHEDULES_GLOBAL,
                    // this should never happen.
                    if (!schedule)
                        throw new Error("Unable to find schedule. The schedule '" + schedule.name + "' does not exist.");

                    $SH_injectWidgetsStatic(".widgets-wrapper", schedule, FIREBASE_SCHEDULES_OBJ, schedule.device, "setting_path", "setting_value");

                    // Make the page header the device's name
                    $("h1.schedule-name").html(UCFirst(schedule.alias));

                    // Set the schedule name input field to the schedule's alias
                    $("#schedule-input-name").val(schedule.alias);

                    // Set the "Device Selector" to the DB Value:
                    $("#schedule-input-device").find("option[value=\"" + schedule.device + "\"]").prop("selected", true);
                    $("#schedule-input-device").selectmenu().selectmenu("refresh", true);

                    // Set the Day checkboxes
                    $(".day-time").each(function () {
                        if(schedule.time.d.indexOf(parseInt($(this).attr("name"))) > -1) {
                            $(this).prop("checked", true).checkboxradio("refresh");
                        }
                        else {
                            $(this).prop("checked", false).checkboxradio("refresh");
                        }
                    });

                    // Set the Hour/Min Selectors
                    $("#schedule-input-hour").val((schedule.time.h > 12) ? schedule.time.h - 12 : schedule.time.h);
                    if(schedule.time.h == 0) $("#schedule-input-hour").val(12);
                    $("#schedule-input-hour").selectmenu().selectmenu("refresh", true);

                    $("#schedule-input-minute").val(schedule.time.m);
                    $("#schedule-input-minute").selectmenu().selectmenu("refresh", true);

                    $("#schedule-input-ampm").val((schedule.time.h >= 12) ? "PM" : "AM");
                    $("#schedule-input-ampm").selectmenu().selectmenu("refresh", true);

                    // <-------------------------- BIND THE SCHEDULE SETTINGS --------------------------> //

                    $("#schedule-input-name").change(function () {
                        schedule.alias = $(this).val();
                        $("h1.schedule-name").html(UCFirst(schedule.alias));
                        FIREBASE_SCHEDULES_OBJ.child(schedule.key).update(schedule);
                    });

                    $("#schedule-input-hour").change(function () {
                        schedule.time.h = $(this).val();
                        if($("#schedule-input-ampm").val() == "PM" && schedule.time.h < 12) schedule.time.h = parseInt(schedule.time.h) + 12;
                        if($("#schedule-input-ampm").val() == "AM" && schedule.time.h >= 12) schedule.time.h = parseInt(schedule.time.h) - 12;
                        if(schedule.time.h == 24) schedule.time.h = 0;
                        if(schedule.time.h == -12) schedule.time.h = 12;
                        schedule.time.h = parseInt(schedule.time.h);
                        FIREBASE_SCHEDULES_OBJ.child(schedule.key).update(schedule);
                    });

                    $("#schedule-input-minute").change(function () {
                        schedule.time.m = $(this).val();
                        schedule.time.m = parseInt(schedule.time.m);
                        FIREBASE_SCHEDULES_OBJ.child(schedule.key).update(schedule);
                    });

                    $("#schedule-input-ampm").change(function () {

                        schedule.time.h += ($(this).val() == "AM") ? -12 : 12;
                        if(schedule.time.h == 24) schedule.time.h = 0;
                        if(schedule.time.h == -12) schedule.time.h = 12;
                        schedule.time.h = parseInt(schedule.time.h);
                        FIREBASE_SCHEDULES_OBJ.child(schedule.key).update(schedule);

                    });

                    $(".day-time").each(function () {
                        $(this).change(function () {
                            if(schedule.time.d.indexOf(parseInt($(this).attr("name"))) == -1 && $(this).prop("checked") == true) {
                                schedule.time.d.push(parseInt($(this).attr("name")));
                                FIREBASE_SCHEDULES_OBJ.child(schedule.key).update(schedule);
                            }
                            else if($(this).prop("checked") == false && schedule.time.d.indexOf(parseInt($(this).attr("name"))) > -1) {
                                schedule.time.d.splice(schedule.time.d.indexOf(parseInt($(this).attr("name"))), 1);
                                FIREBASE_SCHEDULES_OBJ.child(schedule.key).update(schedule);
                            }
                        });
                    });


                    $("#schedule-input-device").change(function () {

                        var value = cleanValue($(this).val());

                        schedule.device = value;
                        schedule.setting_path = [];
                        schedule.setting_value = [];

                        FIREBASE_SCHEDULES_OBJ.child(i).update(schedule);

                        $SH_injectWidgetsStatic(".widgets-wrapper", schedule, FIREBASE_SCHEDULES_OBJ, schedule.device, "setting_path", "setting_value");
                        $("#schedule").trigger("create");
                    });

                    $("#delete-schedule").click(function (e) {

                        e.stopPropagation();
                        e.preventDefault();

                        FIREBASE_SCHEDULES_OBJ.child(i).remove();
                        $.mobile.changePage('schedules.html', { transition: PAGE_TRANSITION_TYPE });
                        return;
                    });

                    break;

                } // End if block

            } // End for loop

            if(!found) {
                $.mobile.changePage("schedules.html");
            }
        });
    }

}); // End $(document).on("pagecreate")

$(document).on("pagebeforecreate", "#schedule", function () { // When the "device" page is inserted into the DOM...
    var keys = Object.keys(global[DEVICES_GLOBAL]);
    for (var i in global[DEVICES_GLOBAL]) {
        $("#schedule-input-device").append('<option ' + ((keys[0] == i) ? "selected" : "") + ' value="' + global[DEVICES_GLOBAL][i].mac + '">' + UCFirst(global[DEVICES_GLOBAL][i].name.replace(/[^a-z0-9]/ig, ' ')) + '</option>')
    }
});
