import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, extname } from 'path';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';

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
        const sub = slug
          ? join(this.uploadDir, 'product_images', slug)
          : this.uploadDir;
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
   * Guarda un archivo recibido por FileInterceptor en memoria (buffer) directamente en disco.
   */
  saveProductImage(file: Express.Multer.File, slug?: string) {
    const rawUploadDir = process.env.UPLOAD_DIR || 'media';
    const uploadDir = rawUploadDir.startsWith('/')
      ? rawUploadDir
      : join(process.cwd(), rawUploadDir);

    const safeSlug = (slug || 'img').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const targetDir = slug
      ? join(uploadDir, 'product_images', safeSlug)
      : uploadDir;

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const ext = extname(file.originalname || '') || '.jpg';
    const random = randomBytes(4).toString('hex');
    const filename = `${safeSlug}_${random}${ext}`;
    const absolutePath = join(targetDir, filename);

    if (file.buffer) {
      writeFileSync(absolutePath, file.buffer);
    } else if (file.path && existsSync(file.path)) {
      writeFileSync(absolutePath, readFileSync(file.path));
    } else {
      throw new Error('No file content received');
    }

    const relativePath = this.toRelativePath(absolutePath, uploadDir);
    return {
      path: relativePath,
      size: file.size,
      mimetype: file.mimetype,
      slug: slug || null,
    };
  }

  /**
   * Helper para convertir path absoluto a URL relativa (lo que se guarda en BD).
   */
  toRelativePath(absolutePath: string, baseDir?: string): string {
    const base = baseDir || this.uploadDir;
    return absolutePath.replace(base + '/', '').replace(base + '\\', '');
  }
}
