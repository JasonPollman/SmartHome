// Incase we want to make this a non-browser thing, this could be changed to global = global in node. :P
var global = window;

/**
 * SmartHome Actions
 */

$(function () { // Wait until the DOM is ready ==> $()

    // Initialize PhoneGap Startup
    //app.initialize();


    // Prevent Users from using the back button to go back to the loading page...
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

                // Remove active status on a button, if transition was triggered with a button
                $.mobile.activePage.find('.ui-btn-active').removeClass('ui-btn-active ui-shadow').css({'box-shadow':'0 0 0 #3388CC'});
            }

        } // End if (typeof to  === 'string')

    }); // End $(document).on('pagebeforechange')

    // <---------------------------------------- JQUERY HANDLERS, ETC. ---------------------------------------> //

    // Add the page transition to every link
    var links = $("a, button");
    for (var i = 0; i < links.length - 1; i++) $(links[i]).attr("data-transition", PAGE_TRANSITION_TYPE);

    // Add the params to the global (window) object, for various uses
    $SH_GetParameters();



}); // End jQuery.ready()
