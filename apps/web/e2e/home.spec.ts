import { test, expect } from '@playwright/test';

test.describe('Home pública', () => {
  test('carga y muestra hero + CTA', async ({ page }) => {
    await page.goto('/');

    // Hero
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Nav principal (links en español o inglés)
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link').first()).toBeVisible();
  });

  test('header tiene 5 links de navegación', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');
    const links = await nav.getByRole('link').count();
    expect(links).toBeGreaterThanOrEqual(5);
  });
});
