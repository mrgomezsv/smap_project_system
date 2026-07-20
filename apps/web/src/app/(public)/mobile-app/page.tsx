import { getTranslations } from 'next-intl/server';
// import { MobileAppDownload } from '@/components/mobile-app/MobileAppDownload';

export async function generateMetadata() {
  const t = await getTranslations('mobileApp');
  return {
    title: `${t('metaTitle')} - Próximamente`,
    description: t('metaDesc'),
  };
}

export default async function MobileAppPage() {
  // NOTA: Esta sección se encuentra comentada temporalmente ya que la aplicación móvil aún no está lista para producción.
  // Se muestra una pantalla amigable de "Próximamente".
  
  return (
    <div className="bg-surface min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 md:p-10 rounded-3xl shadow-medium border border-border">
        <div className="text-7xl animate-bounce">
          📱
        </div>
        <div className="space-y-2">
          <span className="inline-block bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Kidsfun App
          </span>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">
            ¡Muy Pronto!
          </h1>
          <p className="text-text-muted text-base">
            Nuestra aplicación móvil está en desarrollo para ofrecerte una experiencia increíble. Muy pronto podrás descargarla y gestionar todas tus reservas y eventos infantiles desde la palma de tu mano.
          </p>
        </div>
        <div className="pt-4 border-t border-border flex flex-col gap-3">
          <a
            href="/productos"
            className="btn btn-primary w-full py-3 font-bold shadow-soft"
          >
            Ver Catálogo de Productos
          </a>
          <a
            href="/"
            className="text-sm font-bold text-primary hover:underline"
          >
            Volver al Inicio
          </a>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   CÓDIGO ORIGINAL COMENTADO TEMPORALMENTE:
   ==========================================

export default async function MobileAppPageOriginal() {
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
      {/* Hero * /}
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
            {/* Mockup * /}
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

      {/* Features * /}
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

      {/* QR Download * /}
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
========================================== */
