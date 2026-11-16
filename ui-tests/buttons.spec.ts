import { DEFAULT_FIELD, expect, test } from './fixtures';

test.describe('Plus and minus buttons', () => {
    test('plus increases the value by one and updates the host', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 5 } });

        await control.incrementButton.click();

        await expect(control.input).toHaveValue('6');
        await expect.poll(() => control.setCalls()).toEqual([{ field: DEFAULT_FIELD, value: 6 }]);
    });

    test('minus decreases the value by one and updates the host', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 5 } });

        await control.decrementButton.click();

        await expect(control.input).toHaveValue('4');
        await expect.poll(() => control.setCalls()).toEqual([{ field: DEFAULT_FIELD, value: 4 }]);
    });

    test('rapid clicks end on the right value in both the UI and the host', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 5 } });

        for (let i = 0; i < 5; i++) {
            await control.incrementButton.click();
        }
        await control.decrementButton.click();

        await expect(control.input).toHaveValue('9');
        await expect.poll(() => control.lastSetValue()).toBe(9);
    });

    test('minus does not go below zero', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 1 } });

        await control.decrementButton.click();
        await control.decrementButton.click();
        await control.decrementButton.click();

        await expect(control.input).toHaveValue('0');
        await expect.poll(() => control.lastSetValue()).toBe(0);
    });

    test('plus starts from 0 when the field is empty', async ({ control }) => {
        await control.open({ fields: {} });

        await control.incrementButton.click();

        await expect(control.input).toHaveValue('1');
        await expect.poll(() => control.lastSetValue()).toBe(1);
    });

    test('keeps the new value when the host rejects the update', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 5 }, failSet: true });

        await control.incrementButton.click();

        await expect(control.input).toHaveValue('6');
        await expect(control.incrementButton).toBeEnabled();
        // The control stays usable after the failed update.
        await control.failSetFieldValue(false);
        await control.incrementButton.click();
        await expect(control.input).toHaveValue('7');
        await expect.poll(() => control.lastSetValue()).toBe(7);
    });
});
