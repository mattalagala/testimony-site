import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests.
 *  - Locally / CI "local-stack" job: no BASE_URL → starts the built site + sample-data API.
 *  - Against Azure (PR preview, post-deploy smoke): BASE_URL=https://… and no server is started.
 *    Data there is the dev sample set, so tests assert structure, not specific stories.
 */
const baseURL = process.env.BASE_URL ?? 'http://localhost:4173';
const isRemote = Boolean(process.env.BASE_URL);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: isRemote ? 90_000 : 30_000,
  expect: { timeout: isRemote ? 30_000 : 5_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.PW_EXECUTABLE_PATH
      ? { executablePath: process.env.PW_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: isRemote
    ? undefined
    : [
        {
          command: 'npm run serve:seed -w api',
          url: 'http://localhost:7071/api/health',
          reuseExistingServer: !process.env.CI,
        },
        {
          command: 'npm run preview -w web',
          url: 'http://localhost:4173',
          reuseExistingServer: !process.env.CI,
        },
      ],
});
