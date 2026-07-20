import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { CuentaForm } from '@/components/auth/CuentaForm';

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
  };
}

export default async function CuentaPage() {
  const t = await getTranslations('auth');
  return (
    <div className="bg-surface min-h-screen">
      <div className="container py-12 max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-text-primary">
            {t('title')}
          </h1>
          <p className="text-text-muted mt-2">
            {t('subtitle')}
          </p>
        </header>
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <CuentaForm />
        </Suspense>
      </div>
    </div>
  );
}
