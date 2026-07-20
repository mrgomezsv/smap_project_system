import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL ?? API_URL;

const nextConfig = {
  // Build standalone para Docker
  output: 'standalone',
  // Proxy de /api/* al backend NestJS (solo dev). En prod, el cliente debe apuntar
  // directamente al backend o usar un reverse proxy.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
      {
        // Servir /media/* desde el backend en dev (Django/Nest sirven los uploads)
        source: '/media/:path*',
        destination: `${MEDIA_URL}/media/:path*`,
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
