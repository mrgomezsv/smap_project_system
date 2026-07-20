import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('errors.404');
  const tNav = await getTranslations('nav');
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="text-8xl mb-4 animate-bounce">🎈</div>
        <p className="font-mono text-7xl font-extrabold text-primary mb-2">404</p>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text-primary mb-2">
          {t('title')}
        </h1>
        <p className="text-text-muted mb-8">{t('subtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn btn-primary px-6 py-3">
            {t('back')}
          </Link>
          <Link href="/productos" className="btn btn-outline px-6 py-3">
            {tNav('products')}
          </Link>
        </div>
      </div>
    </div>
  );
}
