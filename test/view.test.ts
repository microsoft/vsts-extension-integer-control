import "mocha";
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { Model } from "../src/model";
import { View } from "../src/view";

describe("View", () => {
    let dom: JSDOM;
    let view: View;

    beforeEach(() => {
        dom = new JSDOM("<!doctype html><html><body><div id=\"control-container\"></div></body></html>");
        Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
        Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
    });

    afterEach(() => {
        view?.cleanup();
        dom.window.close();
        delete (globalThis as any).document;
        delete (globalThis as any).window;
    });

    it("renders the model value and reflects updates", () => {
        const model = new Model(7);
        view = new View(model);

        const input = document.querySelector("input") as HTMLInputElement;
        expect(input.value).to.equal("7");
        view.update(11);
        expect(input.value).to.equal("11");
    });

    it("filters non-digits and reports input after the debounce", async () => {
        const changedValues: number[] = [];
        view = new View(new Model(0), (value) => changedValues.push(value));
        const input = document.querySelector("input") as HTMLInputElement;

        input.value = "a2.3-4";
        input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        expect(input.value).to.equal("234");
        expect(changedValues).to.deep.equal([]);

        await new Promise((resolve) => setTimeout(resolve, 550));
        expect(changedValues).to.deep.equal([234]);
    });

    it("reports changes immediately on blur and change", () => {
        const changedValues: number[] = [];
        view = new View(new Model(0), (value) => changedValues.push(value));
        const input = document.querySelector("input") as HTMLInputElement;

        input.value = "18";
        input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
        input.value = "21";
        input.dispatchEvent(new dom.window.Event("blur"));

        expect(changedValues).to.deep.equal([18, 21]);
    });

    it("routes arrow keys and buttons to their callbacks", () => {
        let increments = 0;
        let decrements = 0;
        view = new View(new Model(0), undefined, () => increments++, () => decrements++);
        const input = document.querySelector("input") as HTMLInputElement;

        input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
        input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
        (document.querySelector('button[title="Increment value"]') as HTMLButtonElement).click();
        (document.querySelector('button[title="Decrement value"]') as HTMLButtonElement).click();

        expect(increments).to.equal(2);
        expect(decrements).to.equal(2);
    });

    it("cleanup cancels a pending debounced input", async () => {
        let changes = 0;
        view = new View(new Model(0), () => changes++);
        const input = document.querySelector("input") as HTMLInputElement;

        input.value = "9";
        input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        view.cleanup();
        await new Promise((resolve) => setTimeout(resolve, 550));

        expect(changes).to.equal(0);
    });
});