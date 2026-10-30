import { DEFAULT_FIELD, expect, test } from './fixtures';

test.describe('Accessibility', () => {
    test('buttons have descriptive titles and the input is a numeric textbox', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 5 } });

        await expect(control.incrementButton).toHaveAttribute('title', 'Increment value');
        await expect(control.decrementButton).toHaveAttribute('title', 'Decrement value');
        await expect(control.input).toHaveAttribute('inputmode', 'numeric');
    });

    test('can be operated with Tab and Enter or Space', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 5 } });
        await control.input.focus();

        await control.page.keyboard.press('Tab');
        await expect(control.decrementButton).toBeFocused();
        await control.page.keyboard.press('Space');
        await expect(control.input).toHaveValue('4');

        await control.page.keyboard.press('Tab');
        await expect(control.incrementButton).toBeFocused();
        await control.page.keyboard.press('Enter');
        await expect(control.input).toHaveValue('5');
        await control.page.keyboard.press('Enter');
        await expect(control.input).toHaveValue('6');
        await expect.poll(() => control.lastSetValue()).toBe(6);
    });
});
