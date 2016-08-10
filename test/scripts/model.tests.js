define(["require", "exports", 'chai', './model'], function (require, exports, chai_1, model_1) {
    "use strict";
    describe("Model", function () {
        var model;
        beforeEach(function () {
            model = new model_1.Model(0);
        });
        it("current value of 0", function () {
            chai_1.expect(model.getCurrentValue()).to.be.deep.equal(0);
        });
        it("next value from 0", function () {
            model.selectNextOption();
            chai_1.expect(model.getCurrentValue()).to.be.deep.equal(1);
        });
        it("previous value of 0", function () {
            model.selectPreviousOption();
            chai_1.expect(model.getCurrentValue()).to.be.deep.equal(0);
        });
    });
});
