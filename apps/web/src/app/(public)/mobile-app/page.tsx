import { MobileAppDownload } from '@/components/mobile-app/MobileAppDownload';

export const metadata = {
  title: 'App Móvil - Kidsfun',
  description:
    'Descarga la app móvil de Kidsfun. Catálogo, productos, eventos y más en tu bolsillo.',
};

const FEATURES = [
  {
    icon: '🎪',
    title: 'Catálogo completo',
    description: 'Explora todos nuestros productos y servicios desde tu móvil.',
  },
  {
    icon: '❤️',
    title: 'Likes y comentarios',
    description: 'Guarda tus productos favoritos y deja tu opinión.',
  },
  {
    icon: '🎟️',
    title: 'Eventos y entradas',
    description: 'Compra entradas para eventos y lleva tu QR siempre contigo.',
  },
  {
    icon: '🔔',
    title: 'Notificaciones',
    description: 'Recibe avisos de nuevos productos, eventos y promociones.',
  },
  {
    icon: '💬',
    title: 'Chat directo',
    description: 'Conversa con nuestro equipo para resolver tus dudas al instante.',
  },
  {
    icon: '📍',
    title: 'Reservas rápidas',
    description: 'Reserva tu fecha en pocos pasos desde donde estés.',
  },
];

export default function MobileAppPage() {
  return (
    <div className="bg-surface min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary-700 text-white py-16 overflow-hidden relative">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow px-3 py-1 rounded-full text-sm font-medium mb-4">
                Kidsfun Mobile App
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-3">
                Toda la diversión en tu bolsillo
              </h1>
              <p className="text-white/80 text-lg mb-6">
                Descubre, reserva y disfruta. La forma más fácil de llevar la magia de
                Kidsfun a tu próxima fiesta.
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
          Todo lo que puedes hacer
        </h2>
        <p className="text-text-muted text-center max-w-2xl mx-auto mb-10">
          La app de Kidsfun está diseñada para que planear tu fiesta sea fácil y divertido.
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
            Descarga la app con QR
          </h2>
          <p className="text-white/80 mb-8">
            Escanea el código desde tu móvil y empieza a disfrutar.
          </p>
          <div className="flex justify-center">
            <MobileAppDownload />
          </div>
        </div>
      </section>
    </div>
  );
}
