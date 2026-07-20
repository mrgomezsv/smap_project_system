'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'src' | 'alt' | 'onError'> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
}

/**
 * Wrapper de next/image con fallback en caso de error de carga.
 * Por defecto aplica `loading="lazy"` (Next.js lo hace built-in).
 */
export function SafeImage({ src, alt, fallback, className, ...rest }: SafeImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
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
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
      {...rest}
    />
  );
}
