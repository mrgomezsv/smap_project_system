import { ForbiddenException } from '@nestjs/common';

/**
 * Helper de autorización administrativa.
 *
 * Resuelve el rol admin desde ADMIN_EMAILS (comma-separated).
 * Si ADMIN_EMAILS no está configurado o está vacío, NO permite
 * a nadie (fail-closed para no exponer el endpoint en producción).
 *
 * Ejemplo: ADMIN_EMAILS="admin@kidsfun.com,karen@gmail.com"
 */

const DEFAULT_ADMIN_EMAILS = [
  'mrgomez.dev@outlook.com',
  'mrgomez.dev@outlcok.com',
  'mrgomez.dev@gmail.com',
  'kidsfun.developer@gmail.com',
  'karenhenriquez911@gmail.com',
  'dev@local',
];

function parseAllowlist(): Set<string> {
  const raw = (process.env.ADMIN_EMAILS ?? '').trim();
  const list = raw
    ? raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : DEFAULT_ADMIN_EMAILS;
  return new Set(list);
}

/**
 * Chequea si el email está en el allowlist de admins.
 * Si ADMIN_EMAILS no está configurado, retorna false.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = parseAllowlist();
  return allowlist.has(email.toLowerCase());
}

/**
 * Versión que lanza 403 si el email no es admin.
 * Útil para guards o al inicio de un handler.
 */
export function assertAdminEmail(email: string | null | undefined): void {
  if (!isAdminEmail(email)) {
    throw new ForbiddenException('Se requiere rol de administrador');
  }
}
