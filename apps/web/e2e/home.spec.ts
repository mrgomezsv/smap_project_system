import { test, expect } from '@playwright/test';

test.describe('Home pública', () => {
  test('carga y muestra hero + categorías + CTA', async ({ page }) => {
    await page.goto('/');

    // Hero
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /reservar/i }).first()).toBeVisible();

    // Nav principal
    await expect(page.getByRole('navigation').getByRole('link', { name: /inicio/i })).toBeVisible();
    await expect(page.getByRole('navigation').getByRole('link', { name: /productos/i })).toBeVisible();
    await expect(page.getByRole('navigation').getByRole('link', { name: /eventos/i })).toBeVisible();
  });

  test('header tiene link a inicio, productos, eventos, contacto', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: /inicio/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /productos/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /eventos/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /contacto/i })).toBeVisible();
  });
});
