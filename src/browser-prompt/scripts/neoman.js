$(document).ready(function() {
    /**
     * This library provides behind-the-scenes functionality for browser input pages. It transmits
     * browser state changes continuously back to Neoman (such as browser close events). Conversely,
     * Neoman also continously monitors the WebSockets connection to make sure it hasn't been broken.
     * The intention is to provide a more seamless user experience.
     * 
     * If building a custom input page, include this script to get the above described behavior.
     */

    // If no connection after X seconds browser-side, warn the user.
    // If no connection server-side, inform the user in the console.
    // If connection broken, inform in console.

    var ws = new WebSocket("ws://localhost:3638");
    ws.onopen = function(event) {
        ws.send(JSON.stringify({
            eventType: "load"
        }));
    };
    ws.onerror = function(event) {
        // Should we do something with this?
        console && console.log(event);
    };

    ws.onmessage = function(msgEvent) {
        // Not expecting anything beyond pings from Neoman.
        console && console.log(msgEveent);
    };

    $(window).bind("beforeunload", function() { 
        ws.send(JSON.stringify({
            eventType: "unload"
        }));

        // Let the primary user input page/library handle this:
        // return confirm("Do you really want to close?"); 
    });
});