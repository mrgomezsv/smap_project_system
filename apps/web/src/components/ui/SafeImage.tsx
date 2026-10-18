'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'src' | 'alt' | 'onError'> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  /** Imagen alternativa si `src` falla (p.ej. la original si no hay miniatura). */
  fallbackSrc?: string;
}

/**
 * Wrapper de next/image con fallback en caso de error de carga.
 * Por defecto aplica `loading="lazy"` (Next.js lo hace built-in).
 *
 * Las imágenes subidas (/media/...) se cargan sin el optimizador de Next:
 * el optimizador solo ve los archivos que había en public/ al arrancar el
 * contenedor web, así que las fotos subidas después respondían 400
 * ("isn't a valid image") hasta reiniciarlo. Nginx/API las sirven directo.
 */
export function SafeImage({
  src,
  alt,
  fallback,
  fallbackSrc,
  className,
  unoptimized,
  ...rest
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  if (currentSrc !== src && currentSrc !== fallbackSrc) setCurrentSrc(src);

  if (error || !currentSrc) {
    return (
      <div
        className={[
          'flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-4xl opacity-50',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {fallback ?? '🎪'}
      </div>
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
        else setError(true);
      }}
      loading="lazy"
      unoptimized={unoptimized ?? currentSrc.startsWith('/media/')}
      {...rest}
    />
  );
}
