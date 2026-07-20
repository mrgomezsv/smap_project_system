import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { PARTNER_LABELS, type Event, type EventPartner } from '@/lib/types';

interface PageProps {
  params: { id: string };
}

function formatEventDate(iso: string): { day: string; month: string; full: string; time: string } {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', ''),
    full: d.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    time: d.toLocaleString('es-ES', {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

export default async function EventoDetallePage({ params }: PageProps) {
  let event: Event;
  try {
    event = await api.get<Event>(`/api/events/${params.id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      notFound();
    }
    throw e;
  }

  const date = formatEventDate(event.startDatetime);
  const partnerKey = event.partners as EventPartner;
  const partner = PARTNER_LABELS[partnerKey] ?? PARTNER_LABELS.partner3;
  const hasImage = event.image && !event.image.includes('default_event');
  const eventIsPast = new Date(event.startDatetime) < new Date();

  return (
    <div className="bg-surface min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-surface-elevated border-b border-border">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/" className="hover:text-primary">Inicio</Link>
            <span>/</span>
            <Link href="/eventos" className="hover:text-primary">Eventos</Link>
            <span>/</span>
            <span className="text-text-primary font-medium truncate">{event.title}</span>
          </nav>
        </div>
      </div>

      <div className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ===== IMAGEN PRINCIPAL ===== */}
          <div className="lg:col-span-2">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-br from-brand-yellow/30 to-party-pink/30 shadow-medium">
              {hasImage ? (
                <img
                  src={`/media/${event.image}`}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-9xl opacity-50">
                  🎉
                </div>
              )}
              {/* Date badge */}
              <div className="absolute top-4 left-4 bg-white rounded-xl shadow-large p-3 text-center min-w-[72px]">
                <div className="text-3xl font-extrabold text-primary leading-none">{date.day}</div>
                <div className="text-xs font-bold text-party-pink uppercase mt-1">{date.month}</div>
              </div>
              {/* Partner badge */}
              <span
                className={`absolute top-4 right-4 ${partner.color} text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-medium`}
              >
                {partner.label}
              </span>
              {eventIsPast && (
                <span className="absolute bottom-4 left-4 bg-text-primary/85 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  Evento finalizado
                </span>
              )}
            </div>

            {/* Descripción */}
            <section className="mt-8">
              <h2 className="text-xl font-heading font-bold text-text-primary mb-3">
                Acerca del Evento
              </h2>
              <p className="text-text-primary leading-relaxed whitespace-pre-line text-base">
                {event.description}
              </p>
            </section>

            {/* Info adicional */}
            <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card !p-5 text-center">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Fecha</p>
                <p className="font-bold text-text-primary text-sm mt-1 capitalize">{date.full}</p>
                <p className="text-sm text-primary font-semibold mt-0.5">{date.time}</p>
              </div>
              <div className="card !p-5 text-center">
                <div className="text-3xl mb-2">📍</div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Ubicación</p>
                <p className="font-bold text-text-primary text-sm mt-1">{event.location}</p>
              </div>
              <div className="card !p-5 text-center">
                <div className="text-3xl mb-2">🎟️</div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Entrada</p>
                <p className="font-extrabold text-primary text-lg mt-1">
                  ${event.ticketPrice.toFixed(2)}
                </p>
              </div>
            </section>
          </div>

          {/* ===== SIDEBAR RESERVA ===== */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="card">
                <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text-primary leading-tight">
                  {event.title}
                </h1>

                <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="capitalize">{date.full}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{date.time}</span>
                </div>
                <div className="mt-2 flex items-start gap-2 text-sm text-text-muted">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.location}</span>
                </div>

                <hr className="my-5 border-border" />

                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-text-muted">Precio por entrada</span>
                  <span className="text-3xl font-extrabold text-primary">
                    ${event.ticketPrice.toFixed(2)}
                  </span>
                </div>

                <div className="mt-6 space-y-2">
                  <Link
                    href="/checkout"
                    className="btn btn-primary w-full py-3 text-base shadow-medium hover:shadow-large"
                  >
                    Comprar entrada
                  </Link>
                  <a
                    href={`https://wa.me/13478704240?text=${encodeURIComponent(`Hola, me interesa el evento: ${event.title}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn bg-success text-white hover:bg-success/90 w-full py-3 text-base"
                  >
                    WhatsApp
                  </a>
                </div>

                <p className="mt-4 text-xs text-text-muted text-center">
                  Te contactaremos en menos de 24 horas
                </p>
              </div>

              {/* Card organizador */}
              <div className="card !p-5">
                <p className="text-xs text-text-muted uppercase tracking-wide">Organiza</p>
                <p className="font-heading font-bold text-text-primary mt-1">
                  {partner.label}
                </p>
                <p className="text-xs text-text-muted mt-2">
                  ¿Preguntas sobre el evento? Escríbenos por WhatsApp y te ayudamos.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* CTA final */}
        {!eventIsPast && (
          <section className="mt-16 card bg-gradient-to-br from-primary to-primary-700 text-white !p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-heading font-extrabold mb-2">
              ¿Listo para vivir la experiencia?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Asegura tu entrada ahora o contáctanos para reservar un paquete personalizado
              para tu grupo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/checkout"
                className="btn bg-brand-yellow text-primary hover:bg-brand-yellow-600 px-8 py-3 font-bold shadow-large"
              >
                Comprar entrada
              </Link>
              <Link
                href="/eventos"
                className="btn border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-3 font-bold"
              >
                Ver más eventos
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
