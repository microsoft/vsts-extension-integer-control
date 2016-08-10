define(["require", "exports"], function (require, exports) {
    "use strict";
    var Model = (function () {
        function Model(initialValue) {
            this._currentValue = initialValue;
        }
        Model.prototype.setCurrentValue = function (value) {
            if (value === undefined) {
                throw "Undefined value";
            }
            this._currentValue = value;
        };
        Model.prototype.selectPreviousOption = function () {
            if (this._currentValue > 0 && this._currentValue !== -1) {
                this.setCurrentValue(this._currentValue - 1);
            }
            else {
                this.setCurrentValue(0);
            }
        };
        Model.prototype.selectNextOption = function () {
            this.setCurrentValue(this._currentValue + 1);
        };
        Model.prototype.getCurrentValue = function () {
            return this._currentValue;
        };
        return Model;
    }());
    exports.Model = Model;
});
