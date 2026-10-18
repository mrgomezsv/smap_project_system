import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { api } from '@/lib/api';
import { formatAlbumDate, type GalleryAlbumSummary } from '@/lib/types';
import { AlbumCard } from '@/components/gallery/AlbumCard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('gallery');
  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: { title: t('title'), description: t('subtitle'), type: 'website' },
  };
}

export default async function GaleriaPage() {
  const t = await getTranslations('gallery');
  const locale = await getLocale();
  let albums: GalleryAlbumSummary[] = [];
  try {
    const res = await api.get<{ items: GalleryAlbumSummary[] }>('/api/gallery?take=48');
    albums = res.items;
  } catch (e) {
    console.error('Error cargando galería:', e);
  }

  return (
    <div className="bg-surface min-h-screen">
      <section className="bg-gradient-to-br from-primary via-primary to-primary-700 text-white py-16">
        <div className="container">
          <div className="max-w-2xl">
            <span className="inline-block bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow px-3 py-1 rounded-full text-sm font-medium mb-4">
              📸 {t('badge')}
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-3">{t('title')}</h1>
            <p className="text-white/80 text-lg">{t('subtitle')}</p>
          </div>
        </div>
      </section>

      <div className="container py-12">
        {albums.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4 opacity-40">📸</div>
            <p className="text-text-muted">{t('empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                dateLabel={formatAlbumDate(album.eventDate, locale)}
                photosLabel={t('photos', { count: album.photoCount })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
