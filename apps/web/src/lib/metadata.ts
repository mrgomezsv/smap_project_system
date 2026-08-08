import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kidsfunyfiestasinfantiles.com';
const SITE_NAME = 'Kidsfun y Fiestas Infantiles';
const DEFAULT_DESCRIPTION =
  'Brincolines, juegos inflables y diversión para tus fiestas infantiles. Renta de equipos para cumpleaños, graduaciones y eventos familiares en New York, New Jersey y Connecticut.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Brincolines y fiestas infantiles`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'brincolines',
    'fiestas infantiles',
    'alquiler',
    'New York',
    'New Jersey',
    'Connecticut',
    'eventos',
    'bounce house',
    'inflables',
    'juegos eléctricos',
    'Kidsfun',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Brincolines y fiestas infantiles`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Brincolines y fiestas infantiles`,
    description: DEFAULT_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: 'Entertainment',
};

export { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION };
