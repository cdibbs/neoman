$(document).ready(function() {
    /**
     * This library provides behind-the-scenes functionality for browser input pages. It transmits
     * browser state changes continuously back to Neoman (such as browser close events). Conversely,
     * Neoman also continously monitors the WebSockets connection to make sure it hasn't been broken.
     * The intention is to provide a more seamless user experience.
     * 
     * If building a custom input page, include this script to get the above described behavior.
     * 
     * Client scripts may listen for events to handle user interaction or event cancellation.
     * For cancellation, your script must load and register the appropriate events before neoman.js.
     * 
     * Examples:
     *   - $(window).bind('neoman.[event]', myHandler);
     *   - window.addEventListener('neoman.[event]', myHandler, false);
     * 
     * Events: */
    const neoman_disconnected = "neoman.disconnected"; // When we no longer hear from the Neoman internal HTTP server.
    const neoman_connected = "neoman.connected"; // Based on ws.onopen.
    const neoman_unload = "neoman.unload"; // When we're about to send an unload notification to the Neoman server. Based on browser beforeunload.
    const neoman_load = "neoman.load"; //  When we're about to send a load notification. Based on WebSocket.onopen.
    const neoman_ws_error = "neoman.ws.error"; // WebSocket errors.
    const neoman_ws_message = "neoman.ws.message"; // Messages from Neoman. Not currently used.

    var ws = new WebSocket("ws://localhost:3638");
    setupUserEvents(ws);
    setupLowLevelEvents(ws); // trigger user-land events.

    function setupUserEvents(ws) {
        $(window).bind(neoman_connected, function() {
            ws.send(JSON.stringify({
                eventType: "load"
            }));
        });

        $(window).bind(neoman_unload, function() {
            // Let the primary user page/library handle warning the user about unload.
            // return confirm("Do you really want to leave?"); 
            ws.send(JSON.stringify({
                eventType: "unload"
            }));
        });

        $(window).bind(neoman_ws_error, function(err) {
            console && console.log(event);
        });

        $(window).bind(neoman_ws_message, function(msgEvent) {
            console && console.log(msgEveent);
        });

        $(window).bind(neoman_disconnected, function() {
            console && console.warn('Neoman connection lost.');
            // Do nothing? No way to inform server. It probably knows, anyway.
        });
    }    

    function setupLowLevelEvents(ws) {
        ws.onopen = function(event) {
            $(window).trigger(neoman_connected);
        };
        ws.onerror = function(event) {
            // Should we do something with this?
            $(window).trigger(neoman_ws_error, event);
        };

        ws.onmessage = function(msgEvent) {
            // Not expecting anything beyond pings from Neoman.
            $(window).trigger(neoman_ws_message, msgEvent);
        };

        $(window).bind("beforeunload", function() { 
            $(window).trigger(neoman_unload);
        });

        const interval = setInterval(function ping() {
            if (ws.isAlive === false)
            {   
                $(window).trigger(neoman_disconnected);
                return ws.terminate();
            }

            ws.isAlive = false;
            ws.ping('', false, true);
        }, 1000);

        // If we're here, we're all loaded and setup.
        $(window).trigger(neoman_load);
    }
});