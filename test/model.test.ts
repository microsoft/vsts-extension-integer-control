import "mocha";
import { expect } from "chai";
import { Model } from "../src/model";

describe("Model", () => {
    let model: Model;

    beforeEach(() => {
        model = new Model(0);
    });

    it("correctly initialize value to 0", () => {
        expect(model.getCurrentValue()).to.equal(0);
    });

    it("increments 0 to be 1", () => {
        model.incrementValue();
        expect(model.getCurrentValue()).to.equal(1);
    });

    it("decrements 0 to remain at 0", () => {
        model.decrementValue();
        expect(model.getCurrentValue()).to.equal(0);
    });

    it("decrements 1 to be 0", () => {
        model.setCurrentValue(1);
        model.decrementValue();
        expect(model.getCurrentValue()).to.equal(0);
    });

    it("decrements 20 twice to be 18", () => {
        model.setCurrentValue(20);
        model.decrementValue();
        model.decrementValue();
        expect(model.getCurrentValue()).to.equal(18);
    });

    it("throws error when setting undefined value", () => {
        expect(() => model.setCurrentValue(undefined as any)).to.throw();
    });
});
