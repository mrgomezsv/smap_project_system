/**
 * Optimiza las imágenes que ya están en el servidor (subidas antes de que
 * existiera la optimización automática).
 *
 * Se ejecuta solo al arrancar el contenedor (docker-entrypoint.sh). Una imagen
 * con miniatura ya fue procesada (o subida con la optimización automática)
 * y se salta sin leerla, así que los reinicios no repiten trabajo.
 *
 * Por cada imagen pendiente en UPLOAD_DIR (default ./media), recursivo:
 *  - Si pasa de 1600 px o se puede comprimir, la recomprime EN EL MISMO
 *    archivo y formato (mismo nombre → no hay que tocar la base de datos).
 *  - Genera su miniatura <nombre>_thumb.webp (600 px) si no existe.
 *  - Guarda el original en <UPLOAD_DIR>/_originales/ antes de modificarlo.
 *
 * Uso manual dentro del contenedor de la API (Portainer → api → Console):
 *   node dist/scripts/optimize-existing-images.js           # simulación
 *   node dist/scripts/optimize-existing-images.js --apply   # aplica cambios
 */
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { dirname, extname, join, relative, resolve } from 'path';

const MAX_SIDE = 1600;
const THUMB_SIDE = 600;
const BACKUP_DIR = '_originales';
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === BACKUP_DIR || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (
      EXTS.has(extname(entry.name).toLowerCase()) &&
      !entry.name.endsWith('_thumb.webp')
    )
      yield full;
  }
}

function encode(img: sharp.Sharp, ext: string): sharp.Sharp {
  switch (ext) {
    case '.png':
      return img.png({ compressionLevel: 9, palette: true, quality: 85 });
    case '.webp':
      return img.webp({ quality: 80 });
    default:
      return img.jpeg({ quality: 80, mozjpeg: true });
  }
}

async function exists(p: string) {
  return fs.access(p).then(
    () => true,
    () => false,
  );
}

async function main() {
  const apply = process.argv.includes('--apply');
  const root = resolve(process.env.UPLOAD_DIR || 'media');
  console.log(`📂 Carpeta: ${root} ${apply ? '(APLICANDO)' : '(simulación)'}`);

  let files = 0;
  let skipped = 0;
  let optimized = 0;
  let thumbs = 0;
  let before = 0;
  let after = 0;

  for await (const file of walk(root)) {
    files++;
    const thumbPath = file.replace(/\.[a-z0-9]+$/i, '') + '_thumb.webp';
    if (await exists(thumbPath)) {
      skipped++;
      continue;
    }
    const ext = extname(file).toLowerCase();
    const original = await fs.readFile(file);
    before += original.length;
    try {
      const meta = await sharp(original).metadata();
      const tooBig = (meta.width ?? 0) > MAX_SIDE || (meta.height ?? 0) > MAX_SIDE;
      const out = await encode(
        sharp(original, { failOn: 'none' })
          .rotate()
          .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true }),
        ext,
      ).toBuffer();

      // Solo se reemplaza si ahorra al menos un 10 % (o estaba sobredimensionada)
      const worth = tooBig || out.length < original.length * 0.9;
      const finalBuf = worth && out.length < original.length ? out : original;
      after += finalBuf.length;

      if (finalBuf !== original) {
        optimized++;
        console.log(
          `  ✔ ${relative(root, file)}: ${Math.round(original.length / 1024)} KB → ${Math.round(finalBuf.length / 1024)} KB`,
        );
        if (apply) {
          const backup = join(root, BACKUP_DIR, relative(root, file));
          await fs.mkdir(dirname(backup), { recursive: true });
          if (!(await exists(backup))) await fs.writeFile(backup, original);
          await fs.writeFile(file, finalBuf);
        }
      }

      thumbs++;
      if (apply) {
        const thumb = await sharp(finalBuf, { failOn: 'none' })
          .rotate()
          .resize(THUMB_SIDE, THUMB_SIDE, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 75 })
          .toBuffer();
        await fs.writeFile(thumbPath, thumb);
      }
    } catch (e) {
      after += original.length;
      console.log(`  ⚠ ${relative(root, file)}: ${(e as Error).message}`);
    }
  }

  const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
  console.log(
    `\n${files} imágenes · ${skipped} ya optimizadas · ${optimized} recomprimidas · ${thumbs} miniaturas ${apply ? 'creadas' : 'por crear'}`,
  );
  if (files > skipped) {
    console.log(`Peso de las pendientes: ${mb(before)} MB → ${mb(after)} MB`);
  }
  if (!apply) console.log('Ejecuta con --apply para guardar los cambios.');
  else console.log(`Originales respaldados en ${join(root, BACKUP_DIR)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
