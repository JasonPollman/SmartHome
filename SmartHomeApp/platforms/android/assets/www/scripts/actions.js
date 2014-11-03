
$(function () { // Wait until the DOM is ready ==> $()

    // Initialize PhoneGap Startup
    app.initialize();

    // <---------------------------------------- JQUERY HANDLERS, ETC. ---------------------------------------> //

    // Add the page transition to every link
    var links = $("a, button");
    for (var i = 0; i < links.length - 1; i++) $(links[i]).attr("data-transition", PAGE_TRANSITION_TYPE);

    // Add the params to the global (window) object, for various uses
    $SH_GetParameters();

    document.addEventListener("deviceready", function () {
        console.log("READFY");
    }, true);

}); // End jQuery.ready()
