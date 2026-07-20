import { test, expect } from '@playwright/test';

test.describe('404 / errores', () => {
  test('ruta inexistente muestra página 404 con globito', async ({ page }) => {
    const res = await page.goto('/ruta-que-no-existe-xyz123');
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/404/)).toBeVisible();
    await expect(page.getByRole('link', { name: /volver al inicio/i })).toBeVisible();
  });
});

test.describe('Checkout (sin auth)', () => {
  test('muestra stepper con 3 pasos en /checkout', async ({ page }) => {
    await page.goto('/checkout');
    // Stepper visible
    await expect(page.getByText(/datos/i).first()).toBeVisible();
    await expect(page.getByText(/familiares/i).first()).toBeVisible();
    await expect(page.getByText(/confirmar/i).first()).toBeVisible();
  });

  test('form de datos tiene campos requeridos', async ({ page }) => {
    await page.goto('/checkout');
    // Verificar los inputs (los labels tienen asterisco, así que usamos type + name)
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="tel"]').first()).toBeVisible();
    // Botón "Continuar"
    await expect(page.getByRole('button', { name: /continuar/i })).toBeVisible();
  });
});
