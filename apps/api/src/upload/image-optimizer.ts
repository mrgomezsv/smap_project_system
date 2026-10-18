import { Logger } from '@nestjs/common';
import sharp from 'sharp';

/** Lado mayor máximo de la imagen principal (detalle / galería). */
export const MAX_SIDE = 1600;
/** Lado mayor de la miniatura usada en tarjetas y listados. */
export const THUMB_SIDE = 600;

const logger = new Logger('ImageOptimizer');

export interface OptimizedImage {
  main: Buffer;
  thumb: Buffer | null;
  /** Extensión final de la imagen principal (con punto). */
  ext: string;
}

/** Nombre de la miniatura para un archivo: "dir/foto.jpg" → "dir/foto_thumb.webp". */
export function thumbName(filename: string): string {
  return filename.replace(/\.[a-z0-9]+$/i, '') + '_thumb.webp';
}

/**
 * Redimensiona y recomprime una imagen para web:
 * - Corrige la orientación EXIF y elimina metadatos (GPS, cámara).
 * - Principal: máx. 1600 px por lado, WebP calidad 80.
 * - Miniatura: máx. 600 px por lado, WebP calidad 75.
 * Si sharp no puede decodificarla (p.ej. HEIC sin soporte), devuelve el
 * original sin cambios para no perder la subida.
 */
export async function optimizeImage(
  input: Buffer,
  originalExt: string,
): Promise<OptimizedImage> {
  try {
    const base = sharp(input, { failOn: 'none' }).rotate();
    const [main, thumb] = await Promise.all([
      base
        .clone()
        .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer(),
      base
        .clone()
        .resize(THUMB_SIDE, THUMB_SIDE, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer(),
    ]);
    // Si el original ya era más liviano (imagen pequeña bien comprimida), se conserva
    if (main.length >= input.length && originalExt !== '.heic') {
      return { main: input, thumb, ext: originalExt };
    }
    return { main, thumb, ext: '.webp' };
  } catch (e) {
    logger.warn(
      `No se pudo optimizar la imagen (${originalExt}): ${(e as Error).message}. Se guarda el original.`,
    );
    return { main: input, thumb: null, ext: originalExt };
  }
}
