import { getTranslations } from 'next-intl/server';
import { ContactForm } from '@/components/contact/ContactForm';

export async function generateMetadata() {
  const t = await getTranslations('contact');
  return {
    title: `${t('title')} - Kidsfun`,
    description: t('subtitle'),
  };
}

export default async function ContactoPage() {
  const t = await getTranslations('contact');
  return (
    <div className="bg-surface min-h-screen">
      <section className="bg-gradient-to-br from-primary via-primary to-primary-700 text-white py-16">
        <div className="container">
          <div className="max-w-2xl">
            <span className="inline-block bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow px-3 py-1 rounded-full text-sm font-medium mb-4">
              {t('info')}
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-3">
              {t('title')}
            </h1>
            <p className="text-white/80 text-lg">{t('subtitle')}</p>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          <aside className="lg:col-span-2 space-y-4">
            <div className="card">
              <h2 className="text-lg font-heading font-bold text-text-primary mb-4">
                {t('info')}
              </h2>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    📞
                  </span>
                  <div>
                    <p className="text-text-muted text-xs">{t('phone')}</p>
                    <a href="tel:+13478704240" className="font-semibold text-text-primary hover:text-primary">
                      +1 (347) 870-4240
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-success/10 text-success flex items-center justify-center">
                    💬
                  </span>
                  <div>
                    <p className="text-text-muted text-xs">{t('whatsapp')}</p>
                    <a
                      href="https://wa.me/13478704240"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-text-primary hover:text-success"
                    >
                      +1 (347) 870-4240
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-info/10 text-info flex items-center justify-center">
                    ✉️
                  </span>
                  <div>
                    <p className="text-text-muted text-xs">{t('emails')}</p>
                    <a
                      href="mailto:hello@kidsfunyfiestasinfantiles.com"
                      className="block font-semibold text-text-primary hover:text-primary"
                    >
                      hello@kidsfunyfiestasinfantiles.com
                    </a>
                    <a
                      href="mailto:sales@kidsfunyfiestasinfantiles.com"
                      className="block font-semibold text-text-primary hover:text-primary"
                    >
                      sales@kidsfunyfiestasinfantiles.com
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="card bg-gradient-to-br from-primary to-primary-700 text-white !p-6">
              <h3 className="font-heading font-bold text-lg mb-2">
                {t('whatsappCtaTitle')}
              </h3>
              <p className="text-white/80 text-sm mb-4">
                {t('whatsappCtaSubtitle')}
              </p>
              <a
                href="https://wa.me/13478704240"
                target="_blank"
                rel="noreferrer"
                className="btn bg-success text-white hover:bg-success/90 w-full"
              >
                {t('whatsapp')}
              </a>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
