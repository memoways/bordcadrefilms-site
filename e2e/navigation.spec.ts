import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('header is visible on all main routes', async ({ page }) => {
    const routes = ['/', '/completed-films', '/directors', '/news', '/about', '/contact'];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('header').first()).toBeVisible();
    }
  });

  test('navigates from home to completed films via header', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Films', exact: true }).first().click();
    await expect(page).toHaveURL(/completed-films/);
  });

  test('navigates from home to directors via header', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Directors', exact: true }).first().click();
    await expect(page).toHaveURL(/directors/);
  });
});
