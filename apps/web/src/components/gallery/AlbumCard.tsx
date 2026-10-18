'use client';

import Link from 'next/link';
import { fallbackToOriginal, thumbUrl } from '@/lib/media';
import type { GalleryAlbumSummary } from '@/lib/types';

interface AlbumCardProps {
  album: GalleryAlbumSummary;
  dateLabel: string | null;
  photosLabel: string;
}

/** Tarjeta de álbum: portada + mini collage de 3 fotos. */
export function AlbumCard({ album, dateLabel, photosLabel }: AlbumCardProps) {
  const cover = album.cover ?? album.preview[0];
  const extras = album.preview.filter((p) => p.id !== cover?.id).slice(0, 2);

  return (
    <Link
      href={`/galeria/${album.slug}`}
      className="group card p-0 overflow-hidden hover:shadow-large hover:-translate-y-1 transition-all"
    >
      <div className="relative aspect-[4/3] grid grid-cols-3 grid-rows-2 gap-0.5 bg-gray-100">
        {cover && (
          <img
            src={thumbUrl(cover.path)}
            onError={(e) => fallbackToOriginal(e, cover.path)}
            alt={album.title}
            loading="lazy"
            className={[
              'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500',
              extras.length ? 'col-span-2 row-span-2' : 'col-span-3 row-span-2',
            ].join(' ')}
          />
        )}
        {extras.map((p) => (
          <img
            key={p.id}
            src={thumbUrl(p.path)}
            onError={(e) => fallbackToOriginal(e, p.path)}
            alt=""
            loading="lazy"
            className={['w-full h-full object-cover', extras.length === 1 ? 'row-span-2' : ''].join(' ')}
          />
        ))}
        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full">
          📸 {photosLabel}
        </span>
      </div>
      <div className="p-4">
        {dateLabel && (
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
            {dateLabel}
          </p>
        )}
        <h3 className="font-heading font-bold text-lg text-text-primary group-hover:text-primary transition-colors line-clamp-2">
          {album.title}
        </h3>
        {album.description && (
          <p className="text-sm text-text-muted mt-1 line-clamp-2">{album.description}</p>
        )}
      </div>
    </Link>
  );
}
