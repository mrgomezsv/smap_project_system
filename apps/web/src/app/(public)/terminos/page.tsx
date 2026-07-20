export const metadata = {
  title: 'Términos y Condiciones - Kidsfun',
  description: 'Términos y condiciones de uso del sitio web y servicios de Kidsfun.',
};

const SECTIONS = [
  {
    n: 1,
    title: 'Aceptación de los Términos',
    body: 'Al acceder y utilizar este sitio web, usted acepta estar sujeto a estos términos y condiciones de uso. Si no está de acuerdo con alguna parte de estos términos, le recomendamos que no utilice nuestro sitio.',
  },
  {
    n: 2,
    title: 'Descripción del Servicio',
    body: 'Kidsfun y Fiestas Infantiles es una empresa dedicada al entretenimiento infantil, especializada en:',
    list: [
      'Alquiler de inflables, brincolines y toboganes',
      'Juegos eléctricos y mobiliario para fiestas',
      'Máquinas de concesión y juegos competitivos',
      'Organización de fiestas y eventos infantiles',
      'Equipos de agua y juegos en alquiler',
    ],
  },
  {
    n: 3,
    title: 'Uso del Sitio Web',
    body: 'Usted se compromete a utilizar este sitio web únicamente para fines legales. Está prohibido:',
    list: [
      'Usar el sitio para cualquier propósito ilegal o no autorizado',
      'Transmitir virus, malware o código dañino',
      'Interferir con el funcionamiento del sitio',
      'Intentar acceder a áreas restringidas del sitio',
    ],
  },
  {
    n: 4,
    title: 'Reservas y Pagos',
    body: 'Para confirmar una reserva de nuestros servicios:',
    list: [
      'Se requiere un anticipo del 50% para confirmar la fecha',
      'El pago restante debe realizarse antes o el día del evento',
      'El pago completo por adelantado incluye 5% de descuento',
      'Los pagos se realizan vía Zelle o transferencia bancaria',
    ],
  },
  {
    n: 5,
    title: 'Cancelaciones y Reembolsos',
    body: 'Política de cancelación:',
    list: [
      'Cancelación con más de 7 días de anticipación: reembolso del 80%',
      'Cancelación entre 3 y 7 días: reembolso del 50%',
      'Cancelación con menos de 3 días: sin reembolso',
      'Reagendamiento sin costo según disponibilidad',
    ],
  },
  {
    n: 6,
    title: 'Seguridad y Waiver',
    body: 'Para participar en las actividades es obligatorio firmar el documento de exención de responsabilidad (waiver). Los participantes deben seguir en todo momento las indicaciones de nuestro personal. Kidsfun no se hace responsable por lesiones causadas por mal uso de los equipos o incumplimiento de las normas de seguridad.',
  },
  {
    n: 7,
    title: 'Privacidad y Datos Personales',
    body: 'Su privacidad es importante para nosotros. Recopilamos, usamos y protegemos su información personal de acuerdo con las prácticas estándar de la industria. No compartimos sus datos con terceros sin su consentimiento expreso, salvo requerimiento legal.',
  },
  {
    n: 8,
    title: 'Propiedad Intelectual',
    body: 'Todo el contenido de este sitio web (textos, imágenes, logos, diseños) es propiedad de Kidsfun y Fiestas Infantiles y está protegido por las leyes de propiedad intelectual. Queda prohibida su reproducción total o parcial sin autorización previa.',
  },
  {
    n: 9,
    title: 'Limitación de Responsabilidad',
    body: 'Kidsfun no será responsable por daños indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de usar nuestros servicios. Nuestra responsabilidad total se limita al monto pagado por el servicio contratado.',
  },
  {
    n: 10,
    title: 'Modificaciones',
    body: 'Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Las modificaciones serán efectivas inmediatamente después de su publicación en el sitio web. El uso continuado del sitio después de cualquier cambio constituye su aceptación de los nuevos términos.',
  },
  {
    n: 11,
    title: 'Contacto',
    body: 'Si tiene preguntas sobre estos términos y condiciones, puede contactarnos:',
    contact: true,
  },
];

function LastUpdated() {
  const date = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <div className="bg-info/10 border border-info/30 text-info text-sm rounded-lg p-4">
      <strong>Última actualización:</strong> {date}
    </div>
  );
}

export default function TerminosPage() {
  return (
    <div className="bg-surface min-h-screen">
      <div className="container py-12 max-w-3xl">
        <header className="mb-8">
          <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold mb-3">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-text-primary mb-3">
            Términos y Condiciones
          </h1>
          <p className="text-text-muted">
            Lee cuidadosamente los términos que rigen el uso de nuestro sitio web y
            servicios.
          </p>
        </header>

        <LastUpdated />

        <div className="mt-8 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.n}>
              <h2 className="text-xl font-heading font-bold text-primary mb-3">
                {s.n}. {s.title}
              </h2>
              <p className="text-text-primary leading-relaxed mb-3">{s.body}</p>
              {s.list && (
                <ul className="list-disc list-inside space-y-1.5 text-text-primary pl-2">
                  {s.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {s.contact && (
                <ul className="text-text-primary space-y-1.5 mt-3">
                  <li>
                    <strong>Email:</strong>{' '}
                    <a
                      href="mailto:hello@kidsfunyfiestasinfantiles.com"
                      className="text-primary hover:underline"
                    >
                      hello@kidsfunyfiestasinfantiles.com
                    </a>
                  </li>
                  <li>
                    <strong>Teléfono / WhatsApp:</strong>{' '}
                    <a
                      href="tel:+13478704240"
                      className="text-primary hover:underline"
                    >
                      +1 (347) 870-4240
                    </a>
                  </li>
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
