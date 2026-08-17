import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, extname } from 'path';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { GoogleDriveService } from './google-drive.service';

/**
 * Servicio de upload de archivos.
 * Guarda en MEDIA_DIR (default: ./media) preservando la estructura
 * product_images/<slug>/<slug>_<n>.<ext> similar a Django
 * y sincroniza opcionalmente con Google Drive.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly maxSize: number;

  constructor(private readonly googleDriveService: GoogleDriveService) {
    this.uploadDir = process.env.UPLOAD_DIR || 'media';
    this.maxSize = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10) * 1024 * 1024;
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

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
   * Guarda un archivo localmente y lo sube a la carpeta de Google Drive.
   */
  async saveProductImage(file: Express.Multer.File, slug?: string) {
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

    let buffer: Buffer;
    if (file.buffer) {
      buffer = file.buffer;
      writeFileSync(absolutePath, buffer);
    } else if (file.path && existsSync(file.path)) {
      buffer = readFileSync(file.path);
      writeFileSync(absolutePath, buffer);
    } else {
      throw new Error('No file content received');
    }

    const relativePath = this.toRelativePath(absolutePath, uploadDir);

    // Intentar subida a Google Drive
    let driveUrl: string | null = null;
    try {
      const mimeType = file.mimetype || 'image/jpeg';
      const driveRes = await this.googleDriveService.uploadFile(
        buffer,
        filename,
        mimeType,
      );
      if (driveRes) {
        driveUrl = driveRes.webViewLink;
        this.logger.log(
          `Imagen ${filename} subida exitosamente a Google Drive: ${driveUrl}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `No se pudo subir a Google Drive, manteniendo path local: ${(e as Error).message}`,
      );
    }

    return {
      path: driveUrl || relativePath,
      localPath: relativePath,
      driveUrl: driveUrl || null,
      size: file.size,
      mimetype: file.mimetype,
      slug: slug || null,
    };
  }

  toRelativePath(absolutePath: string, baseDir?: string): string {
    const base = baseDir || this.uploadDir;
    return absolutePath.replace(base + '/', '').replace(base + '\\', '');
  }
}
