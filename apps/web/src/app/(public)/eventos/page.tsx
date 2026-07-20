import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { api } from '@/lib/api';
import { PARTNER_LABELS, type Event, type EventPartner } from '@/lib/types';

// ISR: revalidar cada 5 minutos
export const revalidate = 300;
export const dynamic = 'force-static';

function formatDate(iso: string): { day: string; month: string; full: string } {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', ''),
    full: d.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

export default async function EventosPage() {
  const t = await getTranslations('event');
  const tCommon = await getTranslations('common');
  let events: Event[] = [];
  try {
    const res = await api.get<{ items: Event[] }>('/api/events?take=20');
    events = res.items;
  } catch (e) {
    console.error('Error cargando eventos:', e);
  }

  return (
    <div className="bg-surface min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary-700 text-white py-16">
        <div className="container">
          <div className="max-w-2xl">
            <span className="inline-block bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow px-3 py-1 rounded-full text-sm font-medium mb-4">
              {t('upcoming')}
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-3">
              {t('title')}
            </h1>
            <p className="text-white/80 text-lg">{t('subtitle')}</p>
          </div>
        </div>
      </section>

      <div className="container py-12">
        {events.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4 opacity-40">🎉</div>
            <h3 className="text-xl font-heading font-bold mb-2">{t('noEvents')}</h3>
            <p className="text-text-muted">
              {tCommon('seeMore')} en nuestras redes sociales.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const date = formatDate(event.startDatetime);
              const partner = PARTNER_LABELS[event.partners as EventPartner] ?? PARTNER_LABELS.partner3;
              const hasImage = event.image && !event.image.includes('default_event');
              return (
                <article
                  key={event.id}
                  className="group card hover:shadow-large hover:-translate-y-1 transition-all overflow-hidden p-0"
                >
                  <div className="aspect-[16/9] bg-gradient-to-br from-brand-yellow/30 to-party-pink/30 overflow-hidden relative">
                    {hasImage ? (
                      <img
                        src={`/media/${event.image}`}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-8xl opacity-50">
                        🎉
                      </div>
                    )}
                    {/* Date badge */}
                    <div className="absolute top-3 left-3 bg-white rounded-xl shadow-medium p-2 text-center min-w-[64px]">
                      <div className="text-2xl font-extrabold text-primary leading-none">{date.day}</div>
                      <div className="text-xs font-bold text-party-pink uppercase mt-0.5">{date.month}</div>
                    </div>
                    {/* Partner badge */}
                    <span className={`absolute top-3 right-3 ${partner.color} text-white text-xs font-semibold px-2.5 py-1 rounded-full`}>
                      {partner.label}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading font-bold text-lg text-text-primary line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-muted flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">{date.full}</p>
                    <div className="mt-4 flex items-end justify-between pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-text-muted">{t('from')}</p>
                        <p className="text-2xl font-extrabold text-primary">
                          ${event.ticketPrice.toFixed(2)}
                        </p>
                      </div>
                      <Link href={`/eventos/${event.id}`} className="btn btn-primary">
                        {t('details')}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
