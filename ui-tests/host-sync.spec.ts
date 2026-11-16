import { DEFAULT_FIELD, expect, test } from './fixtures';

test.describe('Sync with the work item form', () => {
    test('shows a value changed on the form', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 2 } });
        await expect(control.input).toHaveValue('2');

        await control.changeField(DEFAULT_FIELD, 11);

        await expect(control.input).toHaveValue('11');
    });

    test('continues from a value changed on the form', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 2 } });
        await expect(control.input).toHaveValue('2');

        await control.changeField(DEFAULT_FIELD, 11);
        await control.incrementButton.click();

        await expect(control.input).toHaveValue('12');
        await expect.poll(() => control.lastSetValue()).toBe(12);
    });

    test('ignores changes to other fields', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 2 } });
        await expect(control.input).toHaveValue('2');

        await control.changeField('Custom.Other', 50);

        await expect(control.input).toHaveValue('2');
    });

    test('ignores changes after the work item is unloaded', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 2 } });
        await expect(control.input).toHaveValue('2');

        await control.unload();
        await control.changeField(DEFAULT_FIELD, 30);

        await expect(control.input).toHaveValue('2');
    });

    test('shows the new work item value when loaded again', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 2 } });
        await expect(control.input).toHaveValue('2');
        await control.unload();

        await control.setHostField(DEFAULT_FIELD, 9);
        await control.load();

        await expect(control.input).toHaveValue('9');
    });

    // Known bug: the first controller's visibilitychange/beforeunload listeners are never removed.
    test.fail('a previous work item value is not written to the next one', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 4 } });
        await expect(control.input).toHaveValue('4');
        await control.unload();
        await control.setHostField(DEFAULT_FIELD, 9);
        await control.load();
        await expect(control.input).toHaveValue('9');

        await control.hideTab();

        await expect.poll(() => control.lastSetValue()).toBe(9);
        expect((await control.setCalls()).map((c) => c.value)).not.toContain(4);
    });
});

test.describe('Saving on tab switch or close', () => {
    test('pushes the current value to the host when the tab is hidden', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 5 } });
        await expect(control.input).toHaveValue('5');

        await control.hideTab();

        await expect.poll(() => control.setCalls()).toEqual([{ field: DEFAULT_FIELD, value: 5 }]);
    });

    test('pushes the current value to the host before unload', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 5 } });
        await expect(control.input).toHaveValue('5');

        await control.beforeUnload();

        await expect.poll(() => control.setCalls()).toEqual([{ field: DEFAULT_FIELD, value: 5 }]);
    });
});
