import { test, expect } from '@playwright/test';

test.describe('Public smoke', () => {
  test('homepage loads', async ({ page }) => {
    test.skip(process.env.CI === 'true' && process.env.PLAYWRIGHT_RUN !== '1', 'CI: set PLAYWRIGHT_RUN=1 and PLAYWRIGHT_BASE_URL, or run locally with npm run dev');
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
