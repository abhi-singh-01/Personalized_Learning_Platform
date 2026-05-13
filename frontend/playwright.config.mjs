import { defineConfig, devices } from '@playwright/test';

/**
 * Browser e2e smoke tests. Start the stack first, then:
 *   npx playwright install
 *   npm run dev   # terminal 1
 *   npm run test:e2e   # terminal 2
 *
 * CI: set PLAYWRIGHT_RUN=1 and PLAYWRIGHT_BASE_URL to your preview URL to enable (optional).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
