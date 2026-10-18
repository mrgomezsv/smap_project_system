/** URL pública de un archivo subido ("foto.webp" → "/media/foto.webp"). */
export function mediaUrl(path: string): string {
  return path.startsWith('/') || /^https?:\/\//.test(path) ? path : `/media/${path}`;
}

/**
 * URL de la miniatura (600 px) que genera la API al subir una imagen:
 * "foto.jpg" → "/media/foto_thumb.webp". Las imágenes antiguas pueden no
 * tenerla: usar siempre con fallback a mediaUrl(path).
 */
export function thumbUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return mediaUrl(path.replace(/\.[a-z0-9]+$/i, '') + '_thumb.webp');
}

/** onError de <img>: si la miniatura no existe, cae a la imagen original. */
export function fallbackToOriginal(
  e: { currentTarget: HTMLImageElement },
  path: string,
): void {
  const el = e.currentTarget;
  if (el.dataset.fallback) return;
  el.dataset.fallback = '1';
  el.src = mediaUrl(path);
}
