/**
 * URL pública del sitio web (sin "/" final), usada en enlaces de correos,
 * QR y PDFs. En producción nunca cae a localhost.
 */
export function getPublicWebUrl(): string {
  const url =
    process.env.PUBLIC_WEB_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_WEB_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://kidsfunyfiestasinfantiles.com'
      : 'http://localhost:3000');
  return url.replace(/\/+$/, '');
}
