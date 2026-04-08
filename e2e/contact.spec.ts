import { test, expect } from '@playwright/test';

test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('form is visible', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
  });

  test('submit button is present and enabled', async ({ page }) => {
    const submit = page.getByRole('button', { name: /envoyer/i });
    await expect(submit).toBeVisible();
    await expect(submit).toBeEnabled();
  });

  test('shows validation feedback on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /envoyer/i }).click();
    // HTML5 required fields should prevent submission or show an error
    const errorOrRequired =
      (await page.locator('[aria-invalid="true"], :invalid').count()) > 0;
    expect(errorOrRequired).toBe(true);
  });
});
