import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { api, ApiError } from '@/lib/api';
import { formatAlbumDate, type GalleryAlbum } from '@/lib/types';
import { mediaUrl } from '@/lib/media';
import { AlbumGallery } from '@/components/gallery/AlbumGallery';
import { ShareButtons } from '@/components/gallery/ShareButtons';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kidsfunyfiestasinfantiles.com').replace(/\/+$/, '');

interface PageProps {
  params: { slug: string };
}

async function loadAlbum(slug: string): Promise<GalleryAlbum | null> {
  try {
    return await api.get<GalleryAlbum>(`/api/gallery/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** Metadatos Open Graph: al compartir el enlace se ve la portada y el título. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const album = await loadAlbum(params.slug).catch(() => null);
  if (!album) return { title: 'Álbum no encontrado' };
  const description =
    album.description?.replace(/\s+/g, ' ').slice(0, 160) ??
    `Fotos de ${album.title} — Kidsfun y Fiestas Infantiles`;
  const image = album.cover
    ? [{
        url: mediaUrl(album.cover.path),
        width: album.cover.width ?? undefined,
        height: album.cover.height ?? undefined,
        alt: album.title,
      }]
    : [];
  return {
    title: album.title,
    description,
    alternates: { canonical: `/galeria/${album.slug}` },
    openGraph: {
      title: album.title,
      description,
      type: 'article',
      url: `/galeria/${album.slug}`,
      images: image,
    },
    twitter: {
      card: 'summary_large_image',
      title: album.title,
      description,
      images: image.map((i) => i.url),
    },
  };
}

export default async function AlbumPage({ params }: PageProps) {
  const album = await loadAlbum(params.slug);
  if (!album) notFound();

  const t = await getTranslations('gallery');
  const locale = await getLocale();
  const date = formatAlbumDate(album.eventDate, locale);
  const shareUrl = `${SITE_URL}/galeria/${album.slug}`;

  return (
    <div className="bg-surface min-h-screen pb-16">
      <div className="container pt-8">
        <Link
          href="/galeria"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          ← {t('back')}
        </Link>

        <header className="mt-4 mb-8 max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted mb-2">
            {date && <span>📅 {date}</span>}
            {album.location && <span>📍 {album.location}</span>}
            <span>📸 {t('photos', { count: album.photos.length })}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-text-primary">
            {album.title}
          </h1>
          {album.description && (
            <div className="mt-4 text-lg text-text-muted whitespace-pre-line leading-relaxed">
              {album.description}
            </div>
          )}
        </header>

        <AlbumGallery
          photos={album.photos}
          title={album.title}
          labels={{ close: t('close'), prev: t('prev'), next: t('next') }}
        />

        <div className="grid gap-6 lg:grid-cols-3 mt-10">
          <div className="lg:col-span-2 space-y-6">
            {album.products.length > 0 && (
              <section className="card">
                <h2 className="font-heading font-bold text-xl text-text-primary mb-4">
                  🎪 {t('featuredProducts')}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {album.products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/productos/${p.id}`}
                      className="group rounded-xl overflow-hidden border border-border hover:shadow-medium transition"
                    >
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        {p.img && !p.img.includes('default') ? (
                          <img
                            src={mediaUrl(p.img)}
                            alt={p.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🎪</div>
                        )}
                      </div>
                      <p className="p-2 text-sm font-semibold text-text-primary line-clamp-2">{p.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
          <div className="space-y-6">
            <ShareButtons
              url={shareUrl}
              title={album.title}
              labels={{
                share: t('share'),
                shareTitle: t('shareTitle'),
                copyLink: t('copyLink'),
                copied: t('copied'),
              }}
            />
            <Link href="/productos?prompt=book" className="btn btn-primary w-full text-center">
              🎉 {t('book')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
