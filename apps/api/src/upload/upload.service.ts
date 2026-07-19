import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { extname } from 'path';

/**
 * Servicio de upload de archivos.
 * Guarda en MEDIA_DIR (default: ./media) preservando la estructura
 * product_images/<slug>/<slug>_<n>.<ext> similar a Django.
 */
@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly maxSize: number;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'media';
    this.maxSize = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10) * 1024 * 1024;
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Storage config para multer: guarda en product_images/<slug>/<slug>_<n>.<ext>
   * Si no hay slug, usa nombre aleatorio.
   */
  getStorage() {
    return diskStorage({
      destination: (req, file, cb) => {
        const slug = (req.body?.slug as string) || '';
        const sub = slug ? join(this.uploadDir, 'product_images', slug) : this.uploadDir;
        if (!existsSync(sub)) {
          mkdirSync(sub, { recursive: true });
        }
        cb(null, sub);
      },
      filename: (req, file, cb) => {
        const ext = extname(file.originalname);
        const random = randomBytes(4).toString('hex');
        const slug = (req.body?.slug as string) || 'img';
        const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
        cb(null, `${safeSlug}_${random}${ext}`);
      },
    });
  }

  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Helper para convertir path absoluto a URL relativa (lo que se guarda en BD).
   */
  toRelativePath(absolutePath: string, baseDir?: string): string {
    const base = baseDir || this.uploadDir;
    return absolutePath.replace(base + '/', '').replace(base + '\\', '');
  }
}
