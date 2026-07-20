import { test, expect } from '@playwright/test';

test.describe('Páginas estáticas', () => {
  test('sobre nosotros carga y muestra misión/visión', async ({ page }) => {
    await page.goto('/sobre-nosotros');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // h3 headings: "Nuestra misión" y "Nuestra visión"
    await expect(page.locator('h3', { hasText: /nuestra misión/i })).toBeVisible();
    await expect(page.locator('h3', { hasText: /nuestra visión/i })).toBeVisible();
  });

  test('métodos de pago muestra info de Zelle', async ({ page }) => {
    await page.goto('/metodos-de-pago');
    await expect(page.locator('h1', { hasText: /métodos de pago/i })).toBeVisible();
    await expect(page.getByText(/zelle/i).first()).toBeVisible();
  });

  test('términos y condiciones muestra secciones', async ({ page }) => {
    await page.goto('/terminos');
    await expect(page.locator('h1', { hasText: /términos y condiciones/i })).toBeVisible();
    await expect(page.getByText(/aceptación de los términos/i)).toBeVisible();
  });

  test('mobile-app landing muestra hero con CTA', async ({ page }) => {
    await page.goto('/mobile-app');
    await expect(page.locator('h1', { hasText: /diversión en tu bolsillo/i })).toBeVisible();
  });
});

test.describe('Contacto', () => {
  test('muestra info de contacto', async ({ page }) => {
    await page.goto('/contacto');
    // El teléfono aparece formateado como +1 (347) 870-4240 (en 2 sitios: tel: y WhatsApp)
    await expect(page.getByText(/347.*870.*4240/).first()).toBeVisible();
    await expect(page.getByText(/hello@kidsfunyfiestasinfantiles\.com/i)).toBeVisible();
  });

  test('formulario tiene los 5 campos requeridos', async ({ page }) => {
    await page.goto('/contacto');
    // Verificar los inputs por type + required
    await expect(page.locator('input[type="text"]')).toHaveCount(2); // Nombre + Apellido
    await expect(page.locator('input[type="tel"]')).toHaveCount(1);
    await expect(page.locator('input[type="email"]')).toHaveCount(1);
    await expect(page.locator('textarea')).toHaveCount(1);
    // Botón de submit
    await expect(page.getByRole('button', { name: /enviar mensaje/i })).toBeVisible();
  });
});
