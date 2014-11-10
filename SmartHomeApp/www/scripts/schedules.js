$(document).on("pagecreate", "#schedules", function () {

    // Grab the schedule placholder from the DOM so we can use it for modification:
    var pseudoSchedule = $(this).find('#pseduo-schedule');
    // Remove it from the DOM
    pseudoSchedule.detach();

    // When a schedule is added to the database:
    FIREBASE_SCHEDULES_OBJ.on("child_added", setSchedule);
    FIREBASE_SCHEDULES_OBJ.on("child_changed", setSchedule);

    function setSchedule (child) {

        console.log(child.val());

        // Clone the pseudeSchedule for modification...
        var newSchedule = pseudoSchedule.clone();

        var schedule = child.val();
        var scheduleName = child.name();

        console.log(schedule);
        if( // Make sure we have the fields we need:
            !(schedule instanceof Object)
        ) {
            console.log("Schedule " + scheduleName + " is missing required fields!");
            return false;
        }
        else if(
            Object.keys(schedule).indexOf("time")   <= -1 ||
            Object.keys(schedule).indexOf("device") <= -1 ||
            Object.keys(schedule).indexOf("alias")  <= -1

        ) {
            console.log("Schedule " + scheduleName + " is missing required fields!");
            return false;
        }

        newSchedule.attr("id", scheduleName);
        newSchedule.find(".schedule-title").html(UCFirst(schedule.alias));
        newSchedule.find(".schedule-device").html(UCFirst(global[DEVICES_GLOBAL][schedule.device].name.replace(/[^a-z0-9\s]/ig, ' ')));

        var days = [];
        for(var i in schedule.time.d) {
            switch(schedule.time.d[i]) {
                case 0:
                    days.push("Su");
                    break;
                case 1:
                    days.push("Mo");
                    break;
                case 2:
                    days.push("Tu");
                    break;
                case 3:
                    days.push("We");
                    break;
                case 4:
                    days.push("Th");
                    break;
                case 5:
                    days.push("Fr");
                    break;
                case 6:
                    days.push("Sa");
                    break;

            }
        }

        var AMPM = (schedule.time.h) >= 12 ? "PM" : "AM";
        var hour = (schedule.time.h) > 12 ? schedule.time.h - 12 : schedule.time.h - 0;
        if(hour == 0) hour = 12;
        var time = hour + ":" + schedule.time.m + " " + AMPM;

        newSchedule.find(".schedule-time").html(time);
        newSchedule.find(".schedule-days").html(days.join(", "));

        newSchedule.find(".schedule-href").attr("href", "schedule.html?id=" + scheduleName);

        var scheduleElem;

        if($("#my-schedules").find(scheduleName).length > 0) {
            scheduleElem = $("#my-schedules").find("#" + scheduleName);
        }
        else {
            $("#my-schedules").append('<div id="' + scheduleName + '"></div>');
            scheduleElem = $('#' + scheduleName);

        } // End if/else block

        scheduleElem.replaceWith(newSchedule);
    }

    // When a schedule is removed from the database:
    FIREBASE_SCHEDULES_OBJ.on("child_removed", function (child) {
        var scheduleName = child.name();
        $("#my-schedules").find("#" + scheduleName).remove();
    });

    $("#add-schedule").click(function (e) {

        e.stopPropagation();
        e.preventDefault();

        var newSchedule = {
            device: global[DEVICES_GLOBAL][Object.keys(global[DEVICES_GLOBAL])[0]].mac,
            time: { d: [0,1,2,3,4,5,6], h: 12, m:00 },
            setting_path: [],
            setting_value: [],
            alias: "New Schedule"
        }

        var newScheduleID = FIREBASE_SCHEDULES_OBJ.push(newSchedule);
        $.mobile.changePage('schedule.html?id=' + newScheduleID.name());
    })

});