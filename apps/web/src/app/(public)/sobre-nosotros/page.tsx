import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Sobre Nosotros - Kidsfun',
  description: 'Conoce la historia, misión y valores de Kidsfun y Fiestas Infantiles.',
};

const STATS = [
  { value: '+5', labelKey: 'years' as const },
  { value: '+500', labelKey: 'parties' as const },
  { value: '+50', labelKey: 'products' as const },
  { value: '100%', labelKey: 'certified' as const },
];

const VALUES = [
  { icon: '🎉', key: 'safeFun' as const },
  { icon: '⭐', key: 'premium' as const },
  { icon: '⏰', key: 'onTime' as const },
  { icon: '💛', key: 'closeService' as const },
];

export default async function SobreNosotrosPage() {
  const t = await getTranslations('about');
  const tNav = await getTranslations('nav');
  const tCommon = await getTranslations('common');

  return (
    <div className="bg-surface min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary-700 text-white py-16">
        <div className="container">
          <div className="max-w-2xl">
            <span className="inline-block bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow px-3 py-1 rounded-full text-sm font-medium mb-4">
              {t('badge')}
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-3">
              {t('heroTitle')}
            </h1>
            <p className="text-white/80 text-lg">{t('heroSubtitle')}</p>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-heading font-extrabold text-text-primary mb-4">
              {t('historyTitle')}
            </h2>
            <div className="space-y-4 text-text-primary leading-relaxed">
              <p>{t('historyP1')}</p>
              <p>{t('historyP2')}</p>
            </div>
          </div>
          <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-brand-yellow/30 to-party-pink/30 flex items-center justify-center text-9xl shadow-medium">
            🎈
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-white py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.labelKey}>
                <p className="text-4xl md:text-5xl font-extrabold text-brand-yellow">{s.value}</p>
                <p className="text-sm text-white/80 mt-1">{t(`stats.${s.labelKey}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Misión / Visión */}
      <section className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
              {t('missionTitle')}
            </h3>
            <p className="text-text-primary leading-relaxed">{t('missionBody')}</p>
          </div>
          <div className="card">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
              {t('visionTitle')}
            </h3>
            <p className="text-text-primary leading-relaxed">{t('visionBody')}</p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="container py-16">
        <h2 className="text-3xl font-heading font-extrabold text-text-primary text-center mb-10">
          {t('valuesTitle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((v) => (
            <div key={v.key} className="card text-center">
              <div className="text-4xl mb-3">{v.icon}</div>
              <h3 className="font-heading font-bold text-text-primary mb-1.5">
                {t(`values.${v.key}.title`)}
              </h3>
              <p className="text-sm text-text-muted">{t(`values.${v.key}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-16">
        <div className="card bg-gradient-to-br from-primary to-primary-700 text-white text-center !p-10">
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold mb-3">
            {t('ctaTitle')}
          </h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">{t('ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/productos"
              className="btn bg-brand-yellow text-primary hover:bg-brand-yellow-600 px-8 py-3 font-bold"
            >
              {tCommon('seeMore')} {tNav('products').toLowerCase()}
            </a>
            <a
              href="/contacto"
              className="btn border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-3 font-bold"
            >
              {tNav('contact')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
