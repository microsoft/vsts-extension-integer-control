"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = require("chai");
const model_1 = require("../src/model");
describe("Model", () => {
    let model;
    beforeEach(() => {
        model = new model_1.Model(0);
    });
    it("correctly initialize value to 0", () => {
        (0, chai_1.expect)(model.getCurrentValue()).to.equal(0);
    });
    it("increments 0 to be 1", () => {
        model.incrementValue();
        (0, chai_1.expect)(model.getCurrentValue()).to.equal(1);
    });
    it("decrements 0 to remain at 0", () => {
        model.decrementValue();
        (0, chai_1.expect)(model.getCurrentValue()).to.equal(0);
    });
    it("decrements 1 to be 0", () => {
        model.setCurrentValue(1);
        model.decrementValue();
        (0, chai_1.expect)(model.getCurrentValue()).to.equal(0);
    });
    it("decrements 20 twice to be 18", () => {
        model.setCurrentValue(20);
        model.decrementValue();
        model.decrementValue();
        (0, chai_1.expect)(model.getCurrentValue()).to.equal(18);
    });
    it("throws error when setting undefined value", () => {
        (0, chai_1.expect)(() => model.setCurrentValue(undefined)).to.throw();
    });
});
//# sourceMappingURL=model.test.js.map