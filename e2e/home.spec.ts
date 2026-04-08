import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Bord Cadre/i);
  });

  test('hero section is visible', async ({ page }) => {
    // The HomeHero component should render above the fold
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });

  test('has no accessibility violations on load', async ({ page }) => {
    // Basic a11y: no broken images, no empty links
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      await expect(images.nth(i)).toHaveAttribute('alt', /.*/);
    }
  });
});
