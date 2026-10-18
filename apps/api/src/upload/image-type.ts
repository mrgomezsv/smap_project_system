/**
 * Detecta el formato real de una imagen por sus "magic bytes".
 * Devuelve la extensión segura (con punto) o null si no es una imagen
 * soportada. Nunca se confía en el nombre ni en el mimetype del cliente:
 * un "foto.html" enviado como image/png se rechaza.
 */
export function detectImageExtension(buf: Buffer): string | null {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
  if (
    buf[0] === 0x89 &&
    buf.subarray(1, 4).toString('ascii') === 'PNG' &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a
  )
    return '.png';
  if (buf.subarray(0, 4).toString('ascii') === 'GIF8') return '.gif';
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return '.webp';
  if (buf[0] === 0x42 && buf[1] === 0x4d) return '.bmp';
  if (buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buf.subarray(8, 12).toString('ascii');
    if (brand === 'avif' || brand === 'avis') return '.avif';
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand))
      return '.heic';
  }
  return null;
}
