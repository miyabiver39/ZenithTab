import { test, expect, Page } from '@playwright/test';

/**
 * Runs against the dev server, where the dashboard persists to
 * localStorage. Every test starts from an empty store with the UI pinned
 * to English so the assertions don't depend on the runner's locale.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Seed once per test (sessionStorage survives reloads within the
    // test's context but not across tests), so a reload keeps the data
    // the test just wrote.
    if (sessionStorage.getItem('zenith-e2e-seeded')) return;
    sessionStorage.setItem('zenith-e2e-seeded', '1');
    localStorage.clear();
    localStorage.setItem(
      'zenith_dashboard_appearance',
      JSON.stringify({
        language: 'en',
        theme: 'dark',
        glassBlur: 16,
        glassOpacity: 0.45,
        borderRadius: '2xl',
        compactMode: false,
        dockPosition: 'bottom',
      })
    );
  });
  await page.goto('/newtab.html');
  await expect(page.locator('#zenith-root')).toBeVisible();
});

const widgetCards = (page: Page) => page.locator('.react-grid-item');

test.describe('first paint', () => {
  test('renders the header, the search bar and the default widgets', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'ZenithTab' })).toBeVisible();
    await expect(page.getByPlaceholder(/Search the web/)).toBeVisible();
    await expect(page.locator('[data-widget-type="clock"]')).toBeVisible();
    // The stock dashboard: search, clock, weather, pomodoro, bookmarks, news, todo, notes.
    await expect(widgetCards(page)).toHaveCount(8);
    await expect(page.getByText('Todo List')).toBeVisible();
  });

  test('the dock shows the regional preset for the UI language', async ({ page }) => {
    const dock = page.locator('.fixed.bottom-4');
    await expect(dock.getByRole('link', { name: 'Google', exact: true })).toBeVisible();
    await expect(dock.getByRole('link', { name: 'Wikipedia' })).toHaveAttribute('href', 'https://www.wikipedia.org');
  });
});

test.describe('modals', () => {
  test('edit mode opens the Add Widget catalogue and adding a widget puts it on the grid', async ({ page }) => {
    await page.getByTitle('Edit Layout').click();
    await page.getByRole('button', { name: 'Add Widget' }).first().click();

    const dialog = page.locator('h2', { hasText: 'Add Widget' });
    await expect(dialog).toBeVisible();

    const qrCard = page.locator('.group', { has: page.getByRole('heading', { name: 'QR Code' }) });
    await qrCard.getByRole('button', { name: 'Add Widget' }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await expect(widgetCards(page)).toHaveCount(9);
    await expect(page.getByRole('heading', { name: 'QR Code' })).toBeVisible();

    // Survives a reload (persisted to storage).
    await page.reload();
    await expect(widgetCards(page)).toHaveCount(9);
  });

  test('the settings panel opens, switches tabs and closes with Escape', async ({ page }) => {
    await page.getByTitle('Settings').click();
    await expect(page.getByRole('heading', { name: 'ZenithTab Settings' })).toBeVisible();

    await page.getByRole('button', { name: 'Language' }).click();
    await expect(page.getByText('Interface Language')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'ZenithTab Settings' })).toBeHidden();
  });

  test('a widget can be reconfigured from its settings modal', async ({ page }) => {
    await page.getByTitle('Edit Layout').click();
    const clockCard = page.locator('.react-grid-item', { has: page.locator('[data-widget-type="clock"]') });
    await clockCard.getByTitle('Widget Settings').click();

    await expect(page.getByRole('heading', { name: 'Configure Clock' })).toBeVisible();
    const title = page.getByPlaceholder('Custom Widget Name');
    await title.fill('Wall Clock');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Wall Clock')).toBeVisible();
  });
});

test.describe('pages', () => {
  test('adding an empty page shows the guidance card and "back" returns to page 1', async ({ page }) => {
    // The header's button (the Quick Notes widget has its own "Add page").
    await page.getByRole('banner').getByRole('button', { name: 'Add page' }).click();
    await page.getByText('New empty page').click();

    await expect(page.getByText('This page is empty')).toBeVisible();
    await expect(page.getByText('Page 2')).toBeVisible();
    await expect(widgetCards(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Back to Page 1' }).click();
    await expect(widgetCards(page)).toHaveCount(8);
  });

  test('duplicating the current page copies its widgets', async ({ page }) => {
    // The header's button (the Quick Notes widget has its own "Add page").
    await page.getByRole('banner').getByRole('button', { name: 'Add page' }).click();
    await page.getByText('Duplicate this page').click();

    await expect(page.getByText('Page 2')).toBeVisible();
    await expect(widgetCards(page)).toHaveCount(8);

    // The page strip carries the keyboard hint as its title; the Quick
    // Notes widget has a 'Page 1' tab of its own.
    await page.getByTitle(/switches pages/).getByText('Page 1', { exact: true }).click();
    await expect(widgetCards(page)).toHaveCount(8);
  });
});

test.describe('widgets', () => {
  test('a todo can be added and completed', async ({ page }) => {
    const input = page.getByPlaceholder('Add a new task...');
    await input.fill('Water the plants');
    await input.press('Enter');

    const task = page.getByText('Water the plants');
    await expect(task).toBeVisible();
    await task.click();
    await expect(task).toHaveClass(/line-through/);
  });

  test('the search bar switches engines and submits a query in a new tab', async ({ page }) => {
    // Capture the URL instead of letting the browser leave for a real
    // search engine (which may bot-block the headless browser).
    await page.evaluate(() => {
      (window as any).__opened = [];
      window.open = ((url: string) => {
        (window as any).__opened.push(String(url));
        return null;
      }) as typeof window.open;
    });
    await page.getByRole('button', { name: /DuckDuckGo/ }).first().click();
    const input = page.getByPlaceholder(/Search the web/);
    await input.fill('zenith tab');
    await input.press('Enter');

    const opened = await page.evaluate(() => (window as any).__opened as string[]);
    expect(opened).toEqual(['https://duckduckgo.com/?q=zenith%20tab']);
  });
});

test.describe('recovery', () => {
  test('a removed widget comes back from the undo toast', async ({ page }) => {
    await page.getByTitle('Edit Layout').click();
    const clockCard = page.locator('.react-grid-item', { has: page.locator('[data-widget-type="clock"]') });
    await clockCard.getByTitle('Remove Widget').click();
    await expect(widgetCards(page)).toHaveCount(7);

    const toast = page.getByRole('status');
    await expect(toast).toContainText('Removed widget "Clock"');
    await toast.getByRole('button', { name: 'Undo' }).click();
    await expect(widgetCards(page)).toHaveCount(8);
    await expect(page.locator('[data-widget-type="clock"]')).toBeVisible();
  });

  test('a removed page can be restored from the trash', async ({ page }) => {
    await page.getByRole('banner').getByRole('button', { name: 'Add page' }).click();
    await page.getByText('Duplicate this page').click();
    await expect(page.getByText('Page 2')).toBeVisible();

    // Removing a page with widgets on it asks first.
    const strip = page.getByTitle(/switches pages/);
    await strip.locator('.group', { hasText: 'Page 2' }).hover();
    await strip.locator('.group', { hasText: 'Page 2' }).getByTitle('Remove page').click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Remove page "Page 2"?');
    await dialog.getByRole('button', { name: 'Remove page' }).click();
    await expect(strip).toBeHidden();

    await page.getByTitle('Settings').click();
    await page.getByRole('button', { name: /^Trash/ }).click();
    const trashList = page.getByRole('list', { name: 'Trash' });
    await expect(trashList.getByRole('listitem')).toHaveCount(1);
    await trashList.getByRole('button', { name: /^Restore: / }).click();

    await expect(page.getByRole('heading', { name: 'ZenithTab Settings' })).toBeHidden();
    await expect(page.getByRole('status')).toContainText('Restored "Page 2" from the trash');
    await expect(strip.getByText('Page 2', { exact: true })).toBeVisible();
    await expect(widgetCards(page)).toHaveCount(8);
  });

  test('a reset can be reverted from the automatic backup', async ({ page }) => {
    const input = page.getByPlaceholder('Add a new task...');
    await input.fill('Keep me');
    await input.press('Enter');
    await expect(page.getByText('Keep me')).toBeVisible();

    await page.getByTitle('Settings').click();
    await page.getByRole('button', { name: 'Backup & Sync' }).click();
    await page.getByRole('button', { name: 'Reset All to Defaults' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Reset All to Defaults' }).click();
    await expect(page.getByText('Keep me')).toBeHidden();

    await page.getByTitle('Settings').click();
    await page.getByRole('button', { name: 'Backup & Sync' }).click();
    const backups = page.getByRole('list', { name: 'Automatic backups' });
    const beforeReset = backups.getByRole('listitem').filter({ hasText: 'Before reset' });
    await expect(beforeReset).toBeVisible();
    await beforeReset.getByRole('button', { name: /^Restore: / }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Restore' }).click();

    await expect(page.getByText('Keep me')).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Restored the backup from');
  });
});
