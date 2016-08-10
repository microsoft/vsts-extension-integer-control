import { expect } from 'chai';
import { Model } from './model';

describe("Model", () => {
    let model: Model;

    beforeEach(() => {
        model = new Model(0);
    });

    it("current value of 0", () => {
        expect(model.getCurrentValue()).to.be.deep.equal(0);
    });

    it("next value from 0", () => {
        model.incrementValue();
        expect(model.getCurrentValue()).to.be.deep.equal(1);
    });

    it("previous value of 0", () => {
        model.decrementValue();
        expect(model.getCurrentValue()).to.be.deep.equal(0);
    });

    it("previous and previous value of 20 is 18", () => {
        model.setCurrentValue(20);
        model.decrementValue();
        model.decrementValue();
        expect(model.getCurrentValue()).to.be.deep.equal(18);
    });

});