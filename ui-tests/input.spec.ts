import { DEFAULT_FIELD, expect, test } from './fixtures';

test.describe('Keyboard and typing', () => {
    test('ArrowUp and ArrowDown change the value by one and update the host', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 5 } });
        await control.input.focus();

        await control.input.press('ArrowUp');
        await expect(control.input).toHaveValue('6');
        await expect.poll(() => control.lastSetValue()).toBe(6);

        await control.input.press('ArrowDown');
        await control.input.press('ArrowDown');
        await expect(control.input).toHaveValue('4');
        await expect.poll(() => control.lastSetValue()).toBe(4);
    });

    test('accepts typed digits', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 0 } });

        await control.input.fill('');
        await control.input.pressSequentially('42');

        await expect(control.input).toHaveValue('42');
    });

    test('does not block numpad digit keys', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 0 } });

        // Playwright cannot press a numpad digit with NumLock on, so dispatch the event directly.
        const prevented = await control.input.evaluate((el) => {
            const event = new KeyboardEvent('keydown', { key: '5', code: 'Numpad5', keyCode: 101, bubbles: true, cancelable: true });
            el.dispatchEvent(event);
            return event.defaultPrevented;
        });

        expect(prevented).toBe(false);
    });

    for (const key of ['a', 'Z', '-', '.', 'Shift+1']) {
        test(`blocks the key "${key}"`, async ({ control }) => {
            await control.open({ fields: { [DEFAULT_FIELD]: 12 } });

            await control.input.press(key);

            await expect(control.input).toHaveValue('12');
        });
    }

    test('strips non-digits from pasted or injected text', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 0 } });

        await control.input.fill('abc12');

        await expect(control.input).toHaveValue('12');
    });

    test('sends typed value to the host after the typing debounce', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 0 } });

        await control.input.fill('15');

        expect(await control.setCalls()).toEqual([]);
        await expect.poll(() => control.lastSetValue()).toBe(15);
    });

    test('sends typed value to the host immediately on blur', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 0 } });

        await control.input.fill('21');
        await control.input.blur();

        // Faster than the 500 ms debounce.
        await expect.poll(() => control.lastSetValue(), { timeout: 300 }).toBe(21);
    });

    test('sends the typed value when Enter is pressed', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 0 } });

        await control.input.fill('8');
        await control.input.press('Enter');

        await expect.poll(() => control.lastSetValue(), { timeout: 300 }).toBe(8);
    });

    test('sends 0 when the field is cleared', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 5 } });

        await control.input.fill('');
        await control.input.blur();

        await expect.poll(() => control.lastSetValue()).toBe(0);
        await expect(control.input).toHaveValue('0');
    });

    test('plus continues from a typed value', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 0 } });

        await control.input.fill('12');
        await control.incrementButton.click();

        await expect(control.input).toHaveValue('13');
        await expect.poll(() => control.lastSetValue()).toBe(13);
    });
});
