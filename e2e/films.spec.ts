import { test, expect } from '@playwright/test';

test.describe('Completed Films', () => {
  test('page loads and shows film grid', async ({ page }) => {
    await page.goto('/completed-films');
    await expect(page).toHaveTitle(/films/i);
    // Film cards should render (at least one)
    await expect(page.locator('article, [data-testid="film-card"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('filter controls are present', async ({ page }) => {
    await page.goto('/completed-films');
    // FilmFilters renders select/input controls
    const filters = page.locator('select, input[type="text"]');
    await expect(filters.first()).toBeVisible();
  });

  test('film detail page loads from grid', async ({ page }) => {
    await page.goto('/completed-films');
    // Click the first film link
    const firstFilmLink = page.locator('a[href*="/completed-films/"]').first();
    await expect(firstFilmLink).toBeVisible({ timeout: 10_000 });
    await firstFilmLink.click();
    await expect(page).toHaveURL(/\/completed-films\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
