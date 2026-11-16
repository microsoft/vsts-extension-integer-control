import "mocha";
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { Controller } from "../src/control";

describe("Controller", () => {
    let dom: JSDOM;

    beforeEach(() => {
        dom = new JSDOM("<!doctype html><html><body><div id=\"control-container\"></div></body></html>");
        Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
        Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
    });

    afterEach(() => {
        dom.window.close();
        delete (globalThis as any).document;
        delete (globalThis as any).window;
    });

    it("loads the configured field into the input", async () => {
        const service = {
            getFieldValue: async (fieldName: string) => {
                expect(fieldName).to.equal("Custom.Count");
                return 8;
            },
            setFieldValue: async () => undefined
        };
        const controller = new Controller({
            getConfiguration: () => ({ witInputs: { FieldName: "Custom.Count" } }),
            getService: async () => service
        } as any);
        await controller.ready;

        expect(controller.getFieldName()).to.equal("Custom.Count");
        expect((document.querySelector("input") as HTMLInputElement).value).to.equal("8");
    });

    it("persists incremented values to the configured field", async () => {
        const writes: Array<[string, number]> = [];
        const service = {
            getFieldValue: async () => 3,
            setFieldValue: async (fieldName: string, value: number) => {
                writes.push([fieldName, value]);
            }
        };
        const controller = new Controller({
            getConfiguration: () => ({ witInputs: { FieldName: "Custom.Count" } }),
            getService: async () => service
        } as any);
        await controller.ready;
        (document.querySelector('button[title="Increment value"]') as HTMLButtonElement).click();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect((document.querySelector("input") as HTMLInputElement).value).to.equal("4");
        expect(writes).to.deep.equal([["Custom.Count", 4]]);
    });

    it("persists edited input values to the configured field", async () => {
        const writes: Array<[string, number]> = [];
        const service = {
            getFieldValue: async () => 3,
            setFieldValue: async (fieldName: string, value: number) => {
                writes.push([fieldName, value]);
            }
        };
        const controller = new Controller({
            getConfiguration: () => ({ witInputs: { FieldName: "Custom.Count" } }),
            getService: async () => service
        } as any);
        await controller.ready;

        const input = document.querySelector("input") as HTMLInputElement;
        input.value = "23";
        input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(writes).to.deep.equal([["Custom.Count", 23]]);
    });

    it("applies external field changes to the input", async () => {
        const controller = new Controller({
            getConfiguration: () => ({ witInputs: { FieldName: "Custom.Count" } }),
            getService: async () => ({ getFieldValue: async () => 1, setFieldValue: async () => undefined })
        } as any);
        await controller.ready;
        controller.updateExternal(15);

        expect((document.querySelector("input") as HTMLInputElement).value).to.equal("15");
    });

    it("saves the current value before the page unloads", async () => {
        const writes: Array<[string, number]> = [];
        const controller = new Controller({
            getConfiguration: () => ({ witInputs: { FieldName: "Custom.Count" } }),
            getService: async () => ({
                getFieldValue: async () => 2,
                setFieldValue: async (fieldName: string, value: number) => {
                    writes.push([fieldName, value]);
                }
            })
        } as any);
        await controller.ready;
        controller.updateExternal(16);

        dom.window.dispatchEvent(new dom.window.Event("beforeunload"));
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(writes).to.deep.equal([["Custom.Count", 16]]);
    });

    it("keeps the default value when reading the field fails", async () => {
        const controller = new Controller({
            getConfiguration: () => ({ witInputs: { FieldName: "Custom.Count" } }),
            getService: async () => ({ getFieldValue: async () => { throw new Error("read failed"); } })
        } as any);
        await controller.ready;

        expect((document.querySelector("input") as HTMLInputElement).value).to.equal("0");
    });

    it("keeps the default value when the service or field value is unavailable", async () => {
        const missingServiceController = new Controller({
            getConfiguration: () => ({ witInputs: { FieldName: "Custom.Count" } }),
            getService: async () => undefined
        } as any);
        await missingServiceController.ready;
        expect((document.querySelector("input") as HTMLInputElement).value).to.equal("0");

        const emptyValueController = new Controller({
            getConfiguration: () => ({ witInputs: { FieldName: "Custom.Count" } }),
            getService: async () => ({ getFieldValue: async () => null })
        } as any);
        await emptyValueController.ready;
        expect((document.querySelector("input") as HTMLInputElement).value).to.equal("0");
    });

    it("shows an error when the required field configuration is missing", async () => {
        const controller = new Controller({
            getConfiguration: () => ({ witInputs: {} }),
            getService: async () => undefined
        } as any);
        await controller.ready;

        expect(document.body.textContent).to.contain("FieldName input is required");
    });
});