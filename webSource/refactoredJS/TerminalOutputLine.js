/**
 * Output line used as instance for rendering terminal content.
 *
 * @param {TerminalOutput} TERMINAL_OUTPUT
 * @constructor
 */
var TerminalOutputLine = function (TERMINAL_OUTPUT) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL_OUTPUT.TERMINAL;

    /**
     * @type {TerminalOutput}
     */
    this.TERMINAL_OUTPUT = TERMINAL_OUTPUT;

    /**
     * @type {HTMLElement}
     * @private
     */
    this._lineElement = document.createElement("div");

    /**
     * Text of line which will be rendered.
     *
     * @type {string}
     */
    this.linePlainText = "";

    /**
     * @type {{positionInLinePlainText: Object[Attributes]}}
     */
    this.graphicRenditionIndex = {};

    /**
     * @type {number}
     */
    this.renderTimeout = 0;

    this.initialize();

};

TerminalOutputLine.prototype.initialize = function () {

    this._lineElement.className = this.TERMINAL_OUTPUT.LINE_CLASSNAME;
    this._lineElement.style.height = this.TERMINAL_OUTPUT.SYMBOL_PIXEL_HEIGHT + "px";

    this.TERMINAL.elements.output.appendChild(this._lineElement);

};

/**
 * @returns {HTMLElement}
 */
TerminalOutputLine.prototype.getElement = function () {
    return this._lineElement;
};

/**
 * Renders linePlainText to html.
 */
TerminalOutputLine.prototype.render = function () {

    var positions = [],
        i,
        lineText = "",
        temp, styled;

    for (i in this.graphicRenditionIndex) {
        positions.push(parseInt(i));
    }

    positions.sort(function(a, b) { return a - b; });

    if (positions[0] !== 0) positions.unshift(0);

    for (i = 0; i < positions.length; i++) {
        temp = ""; styled = "";
        this.graphicRenditionIndex[positions[i]].every(function(a) {
            temp += "term-gri" + a.index + " ";
            if (a.style) styled += (styled ? ";" : "") + a.style + " ";
            return true;
        }, this);
        if (temp) temp = "<span class=\"" + temp + "\"" + (styled ? "style=\""
            + styled.replace("\"", "&quot;") + "\"" : "") + ">";
        lineText += temp + this.linePlainText.substring(
                positions[i] || 0,
                positions[i + 1] || this.linePlainText.length
        ).replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>";
    }

    if (!lineText) lineText = this.linePlainText.replace(/&/g, "&amp;").replace(/</g, "&lt;");

    this._lineElement.innerHTML = lineText;

};

/**
 * Writes plain text to line starting from position. If line overflows, overflowing text will be
 * returned.
 *
 * @param {string} text - Bare text without any non-character symbols. Any html character
 *                        will be replaced with matching entities.
 * @param {number} [position] - Position to insert text to.
 * @returns {string}
 */
TerminalOutputLine.prototype.writePlain = function (text, position) {

    var i, writePart,
        _this = this;

    if (typeof position === "undefined") position = this.linePlainText.length;

    writePart = text.substr(0, this.TERMINAL_OUTPUT.WIDTH - position);

    if (position > this.linePlainText.length) {
        this.linePlainText += (new Array(position - this.linePlainText.length + 1)).join(" ");
    }

    this.linePlainText = this.linePlainText.splice(position, writePart.length, writePart);

    // seek any graphic rendition indexes to the end of writable part
    for (i = position; i < position + writePart.length; i++) {
        if (this.graphicRenditionIndex.hasOwnProperty(i.toString())) {
            this.graphicRenditionIndex[position + writePart.length] =
                (this.graphicRenditionIndex[position + writePart.length] || [])
                    .concat(this.graphicRenditionIndex[i]);
            delete this.graphicRenditionIndex[i];
        }
    }

    // optimize array: exclude zeros. I believe that tactics may be optimized.
    if (this.graphicRenditionIndex[position + writePart.length] instanceof Array) {
        for (i = 0; i < this.graphicRenditionIndex[position + writePart.length].length; i++) {
            if (this.graphicRenditionIndex[position + writePart.length][i].index === 0) {
                this.graphicRenditionIndex[position + writePart.length].splice(0, i + 1);
                i = 0;
            }
        }
        this.graphicRenditionIndex[position + writePart.length] =
            this.graphicRenditionIndex[position + writePart.length].filter(function(elem, pos, a) {
            for (i = 0; i < pos; i++) {
                if (a[pos].index === a[i].index) return false;
            }
            return true;
        });
    }

    if (this.TERMINAL_OUTPUT.anyGraphicRenditionSet()) {

        this.graphicRenditionIndex[position] = [];

        // set new attributes
        for (i in this.TERMINAL_OUTPUT.CURRENT_GRAPHIC_RENDITION) {
            this.graphicRenditionIndex[position].push({
                index: parseInt(i) || i,
                style: this.TERMINAL_OUTPUT.CURRENT_GRAPHIC_RENDITION[i].style
            });
        }

    } else {

        this.graphicRenditionIndex[position] = [{
            index: 0
        }];

    }

    if (!this.renderTimeout) {
        this.renderTimeout = setTimeout(function () {
            _this.render();
            _this.renderTimeout = 0;
        }, 25);
    }

    return text.substr(writePart.length, text.length);

};