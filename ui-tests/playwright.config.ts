import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const root = path.resolve(__dirname, '..');
const port = 4173;

export default defineConfig({
    testDir: __dirname,
    testMatch: '**/*.spec.ts',
    outputDir: path.join(root, 'test-results'),
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [
        ['list'],
        ['html', { open: 'never', outputFolder: path.join(root, 'playwright-report') }]
    ],
    use: {
        baseURL: `http://127.0.0.1:${port}`,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        // Serves the repo root so index.html can load dist/app.js and styles/.
        command: `npx http-server . -a 127.0.0.1 -p ${port} -c-1 -s`,
        cwd: root,
        url: `http://127.0.0.1:${port}/index.html`,
        reuseExistingServer: !process.env.CI
    }
});
