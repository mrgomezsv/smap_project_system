export const metadata = {
  title: 'Métodos de Pago - Kidsfun',
  description: 'Conoce cómo pagar tu reserva: Zelle, transferencia y más.',
};

const STEPS = [
  {
    n: 1,
    title: 'Contáctanos',
    description: 'Escríbenos por WhatsApp o usa el formulario de contacto.',
  },
  {
    n: 2,
    title: 'Recibe los datos',
    description: 'Te compartimos los datos de Zelle y el monto total a cancelar.',
  },
  {
    n: 3,
    title: 'Realiza el pago',
    description: 'Transfiere el 50% para confirmar la reserva o el 100% por adelantado.',
  },
  {
    n: 4,
    title: 'Envía el comprobante',
    description: 'Mándanos el screenshot del pago para confirmar tu fecha.',
  },
];

export default function MetodosDePagoPage() {
  return (
    <div className="bg-surface min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary-700 text-white py-16">
        <div className="container">
          <div className="max-w-2xl">
            <span className="inline-block bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow px-3 py-1 rounded-full text-sm font-medium mb-4">
              Pagos seguros
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-3">
              Métodos de pago
            </h1>
            <p className="text-white/80 text-lg">
              Aceptamos pagos de forma segura a través de Zelle. También podemos
              coordinar transferencia bancaria.
            </p>
          </div>
        </div>
      </section>

      <div className="container py-12 max-w-4xl">
        {/* Zelle card */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center text-2xl">
              💸
            </span>
            <div>
              <h2 className="text-2xl font-heading font-bold text-text-primary">Zelle</h2>
              <p className="text-sm text-text-muted">Transferencia instantánea sin comisiones</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
                Datos del titular
              </h3>
              <p className="text-text-primary">
                Para reservar, contáctanos y te compartimos los datos de Zelle junto con
                el monto a cancelar.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-2">
                Política de reserva
              </h3>
              <ul className="text-text-primary space-y-1.5 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  50% de anticipo para confirmar fecha
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  50% restante el día del evento
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success">✓</span>
                  Pago completo con 5% de descuento
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pasos */}
        <h2 className="text-2xl font-heading font-bold text-text-primary mb-6 text-center">
          ¿Cómo pagar?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STEPS.map((s) => (
            <div key={s.n} className="card text-center !p-5 relative">
              <div className="w-10 h-10 mx-auto rounded-full bg-brand-yellow text-primary font-extrabold flex items-center justify-center mb-3 shadow-soft">
                {s.n}
              </div>
              <h3 className="font-heading font-bold text-text-primary mb-1">{s.title}</h3>
              <p className="text-xs text-text-muted">{s.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="card bg-gradient-to-br from-success to-success/80 text-white text-center !p-8">
          <h3 className="text-2xl font-heading font-extrabold mb-2">¿Listo para reservar?</h3>
          <p className="text-white/90 mb-6 max-w-md mx-auto">
            Escríbenos por WhatsApp y te compartimos los datos de pago en menos de 5 minutos.
          </p>
          <a
            href="https://wa.me/13478704240?text=Hola%2C%20quiero%20reservar%20y%20conocer%20los%20datos%20de%20pago"
            target="_blank"
            rel="noreferrer"
            className="btn bg-white text-success hover:bg-white/90 px-8 py-3 font-bold"
          >
            Abrir WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
