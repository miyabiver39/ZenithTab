import { test, expect } from '@playwright/test';

test.describe('ZenithTab Dashboard E2E', () => {
  test('新しいタブを開いた際にZenithTabが正常に描画されること', async ({ page }) => {
    // In local testing without loaded extension URL, we test the dev server page
    await page.goto('http://localhost:5173/newtab.html');
    
    // Check root element is rendered
    await expect(page.locator('#zenith-root')).toBeVisible();
    
    // Check clock widget is visible
    await expect(page.locator('[data-widget-type="clock"]')).toBeVisible();

    // Check header brand title
    await expect(page.getByText('ZenithTab')).toBeVisible();
  });
});
