import { DEFAULT_FIELD, expect, test } from './fixtures';

test.describe('Configuration', () => {
    test('reads and writes the field configured for the control', async ({ control }) => {
        await control.open({ field: 'Microsoft.VSTS.Scheduling.StoryPoints', fields: { 'Microsoft.VSTS.Scheduling.StoryPoints': 3 } });

        await expect(control.input).toHaveValue('3');
        await control.incrementButton.click();

        await expect.poll(() => control.setCalls()).toEqual([
            { field: 'Microsoft.VSTS.Scheduling.StoryPoints', value: 4 }
        ]);
        expect(await control.getCalls()).toEqual([{ field: 'Microsoft.VSTS.Scheduling.StoryPoints' }]);
    });

    test('uses a different configured field', async ({ control }) => {
        await control.open({ field: 'Custom.Votes', fields: { 'Custom.Votes': 10, [DEFAULT_FIELD]: 99 } });

        await expect(control.input).toHaveValue('10');
        await control.decrementButton.click();

        await expect.poll(() => control.setCalls()).toEqual([{ field: 'Custom.Votes', value: 9 }]);
    });

    test('registers under the contribution id and reports a successful load', async ({ control }) => {
        // open() waits for notifyLoadSucceeded; load() only resolves if the host can reach the registered handler.
        await control.open({ fields: { [DEFAULT_FIELD]: 1 } });

        await expect(control.input).toBeVisible();
        expect(await control.loadFailed()).toBeNull();
    });

    test('shows an error with a documentation link when no field is configured', async ({ control }) => {
        await control.open({ field: null });

        await expect(control.frame.getByText(/FieldName input is required/)).toBeVisible();
        await expect(control.frame.getByRole('link', { name: 'Documentation.' }))
            .toHaveAttribute('href', 'https://docs.microsoft.com/en-us/azure/devops/extend/');
        await expect(control.input).toHaveCount(0);
        await expect(control.incrementButton).toHaveCount(0);
    });
});
