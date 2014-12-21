/**
 * Returns a new spliced string.
 *
 * @param {number} position
 * @param {number} length
 * @param {string} string
 * @returns {string}
 */
String.prototype.splice = function(position, length, string) {
    return (this.slice(0,position) + string + this.slice(position + Math.abs(length)));
};

var AJAX = new function() {

    /**
     * Handler for request.
     *
     * @callback requestCallback
     * @param {string} data
     * @param {boolean} [error]
     */

    /**
     * Gets data from server and handles.
     *
     * @param url
     * @param {requestCallback} callback
     * @param [caching=false] - Cache the result.
     */
    this.get = function (url, callback, caching) {

        var request = new XMLHttpRequest(),
            s;

        caching = "cache=" + ((caching) ? 1 : Math.random());

        request.onreadystatechange = function() {

            if (request.readyState === 4) {

                if (request.status === 200) {
                    callback.call(window, request.responseText, false);
                } else {
                    callback.call(window, "", true);
                }

            }

        };

        s = (url.indexOf("?") === -1) ? "?" : "&";

        try {
            request.open("GET", url + s + caching, true);
            request.send();
        } catch (e) {
            // huh?
        }

    };

};

/**
 * Initialization function. Exported after build.
 *
 * @param {string} authKey
 * @param {string} namespace
 */
this.createTerminal = function (authKey, namespace) {

    var term;

    term = new Terminal({
        container: document.body,
        authKey: authKey || null,
        defaultNamespace: namespace
    });

    // fix for not active input on terminal window (fix placed here, because whole terminal app
    // can be embedded into another app and input focus can cause by-effect)
    window.addEventListener("keydown", function (e) {
        if (!e.ctrlKey && !e.shiftKey && !e.altKey
            && term.elements.input !== document.activeElement) {
            term.input.focus();
        }
    });

    return term;

};