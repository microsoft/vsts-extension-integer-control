import "mocha";
import { expect } from "chai";
import { Controller } from "../src/control";
import { WorkItemFormControl } from "../src/workItemFormControl";

describe("WorkItemFormControl", () => {
    it("forwards changes for the configured field after load", async () => {
        const values: number[] = [];
        const controller = {
            getFieldName: () => "Custom.Count",
            updateExternal: (value: number) => values.push(value)
        } as unknown as Controller;
        const control = new WorkItemFormControl(() => controller);

        control.onLoaded(undefined);
        await new Promise((resolve) => setTimeout(resolve, 110));
        control.onFieldChanged({ changedFields: { "Custom.Count": 14, "Other.Field": 99 } });

        expect(values).to.deep.equal([14]);
    });

    it("ignores changes after unload", async () => {
        let updates = 0;
        const controller = {
            getFieldName: () => "Custom.Count",
            updateExternal: () => updates++
        } as unknown as Controller;
        const control = new WorkItemFormControl(() => controller);

        control.onLoaded(undefined);
        await new Promise((resolve) => setTimeout(resolve, 110));
        control.onUnloaded();
        control.onFieldChanged({ changedFields: { "Custom.Count": 14 } });

        expect(updates).to.equal(0);
    });
});