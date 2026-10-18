'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fallbackToOriginal, mediaUrl, thumbUrl } from '@/lib/media';
import type { GalleryPhoto } from '@/lib/types';

interface AlbumGalleryProps {
  photos: GalleryPhoto[];
  title: string;
  labels: { close: string; prev: string; next: string };
}

/** Clase del mosaico según la forma de la foto (collage tipo revista). */
function tileClass(photo: GalleryPhoto, index: number): string {
  if (index === 0) return 'col-span-2 row-span-2';
  if (!photo.width || !photo.height) return '';
  const ratio = photo.width / photo.height;
  if (ratio > 1.4) return 'col-span-2';
  if (ratio < 0.75) return 'row-span-2';
  return '';
}

/**
 * Collage de fotos del álbum + carrusel a pantalla completa (lightbox) con
 * flechas, teclado (←/→/Esc) y deslizamiento en el celular.
 */
export function AlbumGallery({ photos, title, labels }: AlbumGalleryProps) {
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);
  const total = photos.length;

  const go = useCallback(
    (delta: number) =>
      setOpen((i) => (i === null ? i : (i + delta + total) % total)),
    [total],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, go]);

  if (total === 0) return null;
  const current = open !== null ? photos[open] : null;

  return (
    <>
      {/* Collage */}
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[150px] md:auto-rows-[200px] gap-2 grid-flow-dense">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpen(index)}
            className={`relative overflow-hidden rounded-xl bg-gray-100 group focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${tileClass(photo, index)}`}
            aria-label={photo.caption ?? `${title} — ${index + 1}`}
          >
            <img
              src={index === 0 ? mediaUrl(photo.path) : thumbUrl(photo.path)}
              onError={(e) => fallbackToOriginal(e, photo.path)}
              alt={photo.caption ?? ''}
              loading={index < 4 ? 'eager' : 'lazy'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {photo.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs text-left p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                {photo.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Carrusel a pantalla completa */}
      {current && open !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between p-3 text-white">
            <span className="text-sm font-medium opacity-80">
              {open + 1} / {total}
            </span>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-2xl leading-none"
              aria-label={labels.close}
            >
              ×
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center px-2 md:px-16 min-h-0">
            <img
              key={current.id}
              src={mediaUrl(current.path)}
              alt={current.caption ?? title}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white text-3xl"
                  aria-label={labels.prev}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white text-3xl"
                  aria-label={labels.next}
                >
                  ›
                </button>
              </>
            )}
          </div>

          {current.caption && (
            <p className="text-center text-white/90 text-sm px-4 pt-3">{current.caption}</p>
          )}

          {/* Tira de miniaturas */}
          {total > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3 justify-start md:justify-center">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setOpen(i)}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                    i === open ? 'border-brand-yellow' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={thumbUrl(p.path)}
                    onError={(e) => fallbackToOriginal(e, p.path)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
