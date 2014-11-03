// Incase we want to make this a non-browser thing, this could be changed to global = global in node. :P
var global = window;


// <------------------------------------------- GLOBAL SETTINGS ------------------------------------------> //
var PAGE_TRANSITION_TYPE       = "slide";
var GET_PARAMETERS_GLOBAL_NAME = "$SH_GetParams";


// <------------------------------------------- USEFUL METHODS -------------------------------------------> //
// NOTE THAT ALL FUNCTIONS ARE PREFIXED WITH $SH TO PREVENT NAMESPACE ISSUES!


/**
 * Gets the URL Search String of A Page
 * @return - The list of requested parameters, or if you pass multiple strings, the parameters with those names.
 */
global.$SH_GetParameters = function() {

    var pageURL     = window.location.search.substring(1);
    var vars        = pageURL.split('&');
    var params      = [];

    // The arguments passed to this function, converted into a "real" array...
    var args = Array.prototype.slice.call(arguments);

    // All GET Query Parameters passed
    var allParams = {};

    // Get all parameters
    for(var i = 0; i < vars.length; i++) {

        var param = vars[i].split('=');

        // Convert to an object
        param = { name: param[0], value: param[1] };

        allParams[param.name] = param;

    } // End for loop

    if(args.length > 0) { // The user has requested specific arguments...

        for(var n = 0; n < args.length; n++) (allParams[args[n]]) ? params.push(param) : params.push(null);

    }
    else { // The user didn't specify specific params, pass all back...

        for(var i in allParams) params.push(allParams[i]);

    } // End if/else block

    // If we haven't defined a global yet, do so...
    if((args.length === 0) && (params.length > 0) && !window[GET_PARAMETERS_GLOBAL_NAME])
        window[GET_PARAMETERS_GLOBAL_NAME] = params;

    // Return an array of requested (or all) parameters
    return params;

}; // End $SH_GetParameters()


/**
 * On Demand Page Loader
 * @param pageName - The filename of the Page *** Without the "pages" prefix and extension! ***
 */
global.$SH_LoadPage = function (pageName) {

    // Immediately load the page into the DOM
    $.mobile.loadPage("pages/" + pageName + ".html");

}; // End $SH_LoadPage