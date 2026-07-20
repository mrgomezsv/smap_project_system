import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('payment');
  return { title: `${t('title')} - Kidsfun`, description: t('subtitle') };
}

const STEPS: Array<{ n: 1 | 2 | 3 | 4 }> = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }];

export default async function MetodosDePagoPage() {
  const t = await getTranslations('payment');
  return (
    <div className="bg-surface min-h-screen">
      <section className="bg-gradient-to-br from-primary via-primary to-primary-700 text-white py-16">
        <div className="container">
          <div className="max-w-2xl">
            <span className="inline-block bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow px-3 py-1 rounded-full text-sm font-medium mb-4">
              {t('secureBadge')}
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-3">
              {t('title')}
            </h1>
            <p className="text-white/80 text-lg">{t('subtitle')}</p>
          </div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center text-2xl">
              💸
            </span>
            <div>
              <h2 className="text-2xl font-heading font-bold text-text-primary">Zelle</h2>
              <p className="text-sm text-text-muted">{t('zelleSubtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
                {t('data')}
              </h3>
              <p className="text-text-primary">{t('zelleData')}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
                {t('policy')}
              </h3>
              <ul className="text-text-primary space-y-1.5 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span> {t('policyDeposit')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span> {t('policyRest')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span> {t('policyFull')}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-heading font-bold text-text-primary mb-6 text-center">
          {t('howToTitle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STEPS.map((s) => (
            <div key={s.n} className="card text-center !p-5">
              <div className="w-10 h-10 mx-auto rounded-full bg-brand-yellow text-primary font-extrabold flex items-center justify-center mb-3 shadow-soft">
                {s.n}
              </div>
              <h3 className="font-heading font-bold text-text-primary mb-1">
                {t(`step${s.n}.title`)}
              </h3>
              <p className="text-xs text-text-muted">{t(`step${s.n}.description`)}</p>
            </div>
          ))}
        </div>

        <div className="card bg-gradient-to-br from-success to-success/80 text-white text-center !p-8">
          <h3 className="text-2xl font-heading font-extrabold mb-2">{t('ctaTitle')}</h3>
          <p className="text-white/90 mb-6 max-w-md mx-auto">{t('ctaSubtitle')}</p>
          <a
            href="https://wa.me/13478704240?text=Hola%2C%20quiero%20reservar%20y%20conocer%20los%20datos%20de%20pago"
            target="_blank"
            rel="noreferrer"
            className="btn bg-white text-success hover:bg-white/90 px-8 py-3 font-bold"
          >
            {t('ctaButton')}
          </a>
        </div>
      </div>
    </div>
  );
}
