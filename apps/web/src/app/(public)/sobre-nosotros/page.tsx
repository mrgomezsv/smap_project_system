export const metadata = {
  title: 'Sobre Nosotros - Kidsfun',
  description: 'Conoce la historia, misión y valores de Kidsfun y Fiestas Infantiles.',
};

const STATS = [
  { value: '+5', label: 'Años de experiencia' },
  { value: '+500', label: 'Fiestas realizadas' },
  { value: '+50', label: 'Productos en catálogo' },
  { value: '100%', label: 'Equipos certificados' },
];

const VALUES = [
  {
    icon: '🎉',
    title: 'Diversión segura',
    description: 'Todos nuestros equipos cumplen con normas de seguridad infantil.',
  },
  {
    icon: '⭐',
    title: 'Calidad premium',
    description: 'Productos nuevos, limpios y en perfecto estado para tu evento.',
  },
  {
    icon: '⏰',
    title: 'Puntualidad',
    description: 'Llegamos e instalamos todo en el horario acordado.',
  },
  {
    icon: '💛',
    title: 'Atención cercana',
    description: 'Te acompañamos desde la reserva hasta el final de la fiesta.',
  },
];

export default function SobreNosotrosPage() {
  return (
    <div className="bg-surface min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary-700 text-white py-16">
        <div className="container">
          <div className="max-w-2xl">
            <span className="inline-block bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow px-3 py-1 rounded-full text-sm font-medium mb-4">
              Sobre nosotros
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-3">
              Más de 5 años creando sonrisas
            </h1>
            <p className="text-white/80 text-lg">
              Somos una empresa familiar especializada en entretenimiento infantil y
              organización de fiestas en El Salvador y Miami.
            </p>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-heading font-extrabold text-text-primary mb-4">
              Nuestra historia
            </h2>
            <div className="space-y-4 text-text-primary leading-relaxed">
              <p>
                Kidsfun nació del sueño de transformar cada celebración infantil en una
                experiencia mágica e inolvidable. Empezamos como un pequeño emprendimiento
                familiar y hoy somos referentes en alquiler de inflables, juegos eléctricos
                y organización de fiestas en El Salvador.
              </p>
              <p>
                Con el tiempo, expandimos nuestras operaciones a Miami para llevar la magia
                de Kidsfun a más familias, manteniendo siempre los valores que nos
                definieron desde el primer día: seguridad, calidad y atención cercana.
              </p>
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
              <div key={s.label}>
                <p className="text-4xl md:text-5xl font-extrabold text-brand-yellow">{s.value}</p>
                <p className="text-sm text-white/80 mt-1">{s.label}</p>
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
              Nuestra misión
            </h3>
            <p className="text-text-primary leading-relaxed">
              Hacer que cada fiesta infantil sea segura, divertida y sin estrés para los
              padres, ofreciendo productos de calidad y un servicio personalizado que supere
              sus expectativas.
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
              Nuestra visión
            </h3>
            <p className="text-text-primary leading-relaxed">
              Ser la empresa líder de entretenimiento infantil en la región, reconocida
              por nuestra innovación, calidad y compromiso con la seguridad de los niños.
            </p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="container py-16">
        <h2 className="text-3xl font-heading font-extrabold text-text-primary text-center mb-10">
          Nuestros valores
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="card text-center">
              <div className="text-4xl mb-3">{v.icon}</div>
              <h3 className="font-heading font-bold text-text-primary mb-1.5">{v.title}</h3>
              <p className="text-sm text-text-muted">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-16">
        <div className="card bg-gradient-to-br from-primary to-primary-700 text-white text-center !p-10">
          <h2 className="text-2xl md:text-3xl font-heading font-extrabold mb-3">
            ¿Listo para tu próxima fiesta?
          </h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            Reserva ahora o contáctanos para una cotización personalizada.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/productos"
              className="btn bg-brand-yellow text-primary hover:bg-brand-yellow-600 px-8 py-3 font-bold"
            >
              Ver productos
            </a>
            <a
              href="/contacto"
              className="btn border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-3 font-bold"
            >
              Contactar
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
