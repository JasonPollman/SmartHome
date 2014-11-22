/**
 * SmartHome Actions
 */

/**
 * Prevent Users from using the back button to go back to the loading page...
 */
$(document).on('pagebeforechange', function(e, data){

    var to   = data.toPage;
    var from = data.options.fromPage;

    if (typeof to  === 'string') {

        var to = $.mobile.path.parseUrl(to).filename.replace(/(.*)\.(.*)/ig, '$1');
        var from = $(from).attr("id");

        if (from !== 'loading-page' && to === 'index') {

            e.preventDefault();
            e.stopPropagation();
            history.go(1);

            //$.mobile.activePage.find('.ui-btn-active').removeClass('ui-btn-active ui-shadow').css({'box-shadow':'0 0 0 #3388CC'});
        }

    } // End if (typeof to  === 'string')

}); // End $(document).on('pagebeforechange')


/**
 * Makes the jQuery Mobile "Content" Page portion exhume the rest of the screen...
 */
$(document).on("pagecreate", resizeHeight);


/**
 * "Retrys" the SmartHome API Connection on a connection failure...
 */
$(document).on("pagecreate", function () {

    $(".try-again").click(function (e) {

        e.stopPropagation();
        e.preventDefault();

        global[LAST_PAGE_GLOBAL] = window.location.pathname.split("/").pop();
        window.location.href = "index.html?page=" + global[LAST_PAGE_GLOBAL] + "&" + window.location.search.slice(1, window.location.search.length)

    });
});


/**
 * Remove Firebase Listeners on each page change.
 * Since we're not re-loading the DOM, this is important as if you update
 * a value within an 'on("value")' function, you'll end up doing this
 * the number of times the page has loaded for each declaration.
 */
$(document).on("pageremove", function () {
    for(var i in FIREBASES) {
        if(FIREBASES[i] != undefined && FIREBASES[i].off != undefined) FIREBASES[i].off();
    }
});


/**
 * Sets the user's color preference
 */
$(document).on("pagecreate", function () {

    FIREBASE_USER_ROOT_OBJ.once("value", function (data) {

        var user = data.val();

        if (!user.settings) {
            user.settings = {};
            if (!user.settings.color) user.settings.color = "green";
        }

        FIREBASE_USER_ROOT_OBJ.update(user);
        $('link[href="' + USER_COLOR + '"]').attr('href', 'lib/native-droid/css/jquerymobile.nativedroid.color.' + user.settings.color + '.css');
        USER_COLOR = 'lib/native-droid/css/jquerymobile.nativedroid.color.' + user.settings.color + '.css';

        $("#change-color").val(user.settings.color).selectmenu().selectmenu("refresh", true);

        $("#change-color").change(function () {
            $('link[href="' + USER_COLOR + '"]').attr('href', 'lib/native-droid/css/jquerymobile.nativedroid.color.' + $(this).val() + '.css');
            USER_COLOR = 'lib/native-droid/css/jquerymobile.nativedroid.color.' + $(this).val() + '.css';
            user.settings.color = $(this).val();
            FIREBASE_USER_ROOT_OBJ.update(user);
        });


    });

}); // End $(document).on("pagecreate")


/**
 * Adds the default page transition to EVERY page using the global setting (for consistency).
 */
$(document).on("pagecreate", function () {
    var links = $("a, button");
    for (var i = 0; i < links.length - 1; i++) $(links[i]).attr("data-transition", PAGE_TRANSITION_TYPE);
});


// Add the params to the global (window) object, for various uses
$SH_GetParameters();
