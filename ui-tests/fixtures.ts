import { test as base, expect, FrameLocator, Locator, Page } from '@playwright/test';

export { expect };

export const DEFAULT_FIELD = 'Custom.HitCount';

export interface HostOptions {
    /** Configured FieldName input; null simulates a control without a field. */
    field?: string | null;
    /** Initial work item field values held by the mock host. */
    fields?: Record<string, unknown>;
    failGet?: boolean;
    failSet?: boolean;
}

export interface FieldCall {
    field: string;
    value?: number;
}

export class ControlPage {
    readonly frame: FrameLocator;
    readonly container: Locator;
    readonly input: Locator;
    readonly incrementButton: Locator;
    readonly decrementButton: Locator;

    constructor(readonly page: Page) {
        this.frame = page.frameLocator('#extension');
        this.container = this.frame.locator('#control-container');
        this.input = this.frame.locator('input.bolt-textfield-input');
        // Accessible name comes from the "+"/"−" text, so buttons are found by title.
        this.incrementButton = this.frame.getByTitle('Increment value');
        this.decrementButton = this.frame.getByTitle('Decrement value');
    }

    /** Opens the mock host and waits for the extension to register; optionally sends onLoaded. */
    async open(options: HostOptions = {}, { load = true } = {}): Promise<void> {
        await this.page.addInitScript((o) => { (window as any).__hostOptions = o; }, options);
        await this.page.goto('/ui-tests/host/host.html');
        await this.page.waitForFunction(() => (window as any).__host?.loaded === true);
        if (load) {
            await this.load();
        }
    }

    async load(): Promise<void> {
        await this.page.evaluate(() => (window as any).__host.load());
    }

    async unload(): Promise<void> {
        await this.page.evaluate(() => (window as any).__host.unload());
    }

    async changeField(name: string, value: number): Promise<void> {
        await this.page.evaluate(([n, v]) => (window as any).__host.changeField(n, v), [name, value] as const);
    }

    async setHostField(name: string, value: unknown): Promise<void> {
        await this.page.evaluate(([n, v]) => { (window as any).__host.fields[n as string] = v; }, [name, value] as const);
    }

    async failSetFieldValue(fail: boolean): Promise<void> {
        await this.page.evaluate((f) => { (window as any).__host.failSet = f; }, fail);
    }

    setCalls(): Promise<FieldCall[]> {
        return this.page.evaluate(() => (window as any).__host.setCalls);
    }

    getCalls(): Promise<FieldCall[]> {
        return this.page.evaluate(() => (window as any).__host.getCalls);
    }

    loadFailed(): Promise<unknown> {
        return this.page.evaluate(() => (window as any).__host.loadFailed);
    }

    async lastSetValue(): Promise<number | undefined> {
        const calls = await this.setCalls();
        return calls[calls.length - 1]?.value;
    }

    private async contentFrame() {
        const handle = await this.page.locator('#extension').elementHandle();
        const frame = await handle!.contentFrame();
        return frame!;
    }

    /** Simulates the user switching to another browser tab. */
    async hideTab(): Promise<void> {
        const frame = await this.contentFrame();
        await frame.evaluate(() => {
            Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
            document.dispatchEvent(new Event('visibilitychange'));
        });
    }

    /** Simulates the page being closed or navigated away. */
    async beforeUnload(): Promise<void> {
        const frame = await this.contentFrame();
        await frame.evaluate(() => { window.dispatchEvent(new Event('beforeunload')); });
    }
}

export const test = base.extend<{ control: ControlPage }>({
    control: async ({ page }, use) => {
        const blocked: string[] = [];
        // Nothing outside the local server may be reached.
        await page.route((url) => url.hostname !== '127.0.0.1', (route) => {
            blocked.push(route.request().url());
            return route.abort();
        });

        await use(new ControlPage(page));

        expect(blocked, 'unexpected external requests').toEqual([]);
    }
});
