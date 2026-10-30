import { DEFAULT_FIELD, expect, test } from './fixtures';

test.describe('Initial rendering', () => {
    test('is empty until the host reports the work item as loaded', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 7 } }, { load: false });

        await expect(control.container).toBeEmpty();
        await expect(control.input).toHaveCount(0);
    });

    test('shows the input and the plus and minus buttons after load', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 7 } });

        await expect(control.input).toBeVisible();
        await expect(control.incrementButton).toHaveText('+');
        await expect(control.decrementButton).toHaveText('−');
    });

    test('shows the current field value from the host', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 7 } });

        await expect(control.input).toHaveValue('7');
    });

    for (const [label, value] of [['null', null], ['non-numeric', 'abc']] as const) {
        test(`shows 0 when the field value is ${label}`, async ({ control }) => {
            await control.open({ fields: { [DEFAULT_FIELD]: value } });

            await expect(control.input).toHaveValue('0');
        });
    }

    test('shows 0 when the field has no value', async ({ control }) => {
        await control.open({ fields: {} });

        await expect(control.input).toHaveValue('0');
    });

    test('still renders with 0 when reading the field fails', async ({ control }) => {
        await control.open({ fields: { [DEFAULT_FIELD]: 7 }, failGet: true });

        await expect(control.input).toHaveValue('0');
        await expect(control.incrementButton).toBeVisible();
    });
});
