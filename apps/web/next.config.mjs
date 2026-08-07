import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const nextConfig = {
  // Build standalone para Docker
  output: 'standalone',
  // ESLint tiene issues con versiones de typescript-eslint; lo desactivamos en build
  // (los IDEs y el dev server siguen validando con tsc)
  eslint: { ignoreDuringBuilds: true },
  // Proxy de /api/* al backend NestJS (solo dev). En prod, el cliente debe apuntar
  // directamente al backend o usar un reverse proxy.
  // NOTA: NO proxiar /media/* — Next.js sirve los archivos estáticos desde
  // apps/web/public/media directamente (vía volumen media_data). Si se proxea,
  // el destino se hornea al build y rompe el routing.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: 'kidsfunyfiestasinfantiles.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
