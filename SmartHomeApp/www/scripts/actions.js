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
$(document).on("pagecreate", "#loading-page", function () {

    var screen = $.mobile.getScreenHeight(),
        header = $(".ui-header").hasClass("ui-header-fixed") ? $(".ui-header").outerHeight() - 1 : $(".ui-header").outerHeight(),
        footer = $(".ui-footer").hasClass("ui-footer-fixed") ? $(".ui-footer").outerHeight() - 1 : $(".ui-footer").outerHeight(),
        contentCurrent = $(".ui-content").outerHeight() - $(".ui-content").height();
    var content = screen - header - footer - contentCurrent;
    $(".ui-content").each(function () {
        if(!$(this).parent().hasClass("ui-popup")) {
            $(this).height(content);
        }
    });

});

// <---------------------------------------- JQUERY HANDLERS, ETC. ---------------------------------------> //

// Add the page transition to every link
var links = $("a, button");
for (var i = 0; i < links.length - 1; i++) $(links[i]).attr("data-transition", PAGE_TRANSITION_TYPE);

// Add the params to the global (window) object, for various uses
$SH_GetParameters();
