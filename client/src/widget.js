"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Widget = void 0;
var Widget = /** @class */ (function () {
    function Widget(table) {
        this.table = null;
        this.table = table;
    }
    Widget.prototype.render = function () {
        console.log(this.table);
    };
    return Widget;
}());
exports.Widget = Widget;
