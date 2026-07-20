import { getTranslations } from 'next-intl/server';
import { MobileAppDownload } from '@/components/mobile-app/MobileAppDownload';

export async function generateMetadata() {
  const t = await getTranslations('mobileApp');
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
  };
}

export default async function MobileAppPage() {
  const t = await getTranslations('mobileApp');

  const FEATURES = [
    {
      icon: '🎪',
      title: t('features.catalog.title'),
      description: t('features.catalog.desc'),
    },
    {
      icon: '❤️',
      title: t('features.likes.title'),
      description: t('features.likes.desc'),
    },
    {
      icon: '🎟️',
      title: t('features.events.title'),
      description: t('features.events.desc'),
    },
    {
      icon: '🔔',
      title: t('features.notifications.title'),
      description: t('features.notifications.desc'),
    },
    {
      icon: '💬',
      title: t('features.chat.title'),
      description: t('features.chat.desc'),
    },
    {
      icon: '📍',
      title: t('features.bookings.title'),
      description: t('features.bookings.desc'),
    },
  ];

  return (
    <div className="bg-surface min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary-700 text-white py-16 overflow-hidden relative">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow px-3 py-1 rounded-full text-sm font-medium mb-4">
                {t('heroBadge')}
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-3">
                {t('heroTitle')}
              </h1>
              <p className="text-white/80 text-lg mb-6">
                {t('heroSubtitle')}
              </p>
              <a
                href="https://play.google.com/store/apps/details?id=com.kidsfun.app.kidsfun"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img
                  alt="Descargar en Google Play"
                  src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                  width={200}
                  height={75}
                  className="h-14 w-auto"
                />
              </a>
            </div>
            {/* Mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-56 h-[28rem] bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-brand-yellow/30 to-party-pink/30 rounded-[2rem] flex items-center justify-center text-8xl">
                    🎉
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center text-2xl shadow-large animate-bounce">
                  🎈
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <h2 className="text-3xl font-heading font-extrabold text-text-primary text-center mb-3">
          {t('featuresTitle')}
        </h2>
        <p className="text-text-muted text-center max-w-2xl mx-auto mb-10">
          {t('featuresSubtitle')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-heading font-bold text-text-primary mb-1.5">{f.title}</h3>
              <p className="text-sm text-text-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QR Download */}
      <section className="bg-primary text-white py-16">
        <div className="container max-w-2xl text-center">
          <h2 className="text-3xl font-heading font-extrabold mb-3">
            {t('qrTitle')}
          </h2>
          <p className="text-white/80 mb-8">
            {t('qrSubtitle')}
          </p>
          <div className="flex justify-center">
            <MobileAppDownload />
          </div>
        </div>
      </section>
    </div>
  );
}
