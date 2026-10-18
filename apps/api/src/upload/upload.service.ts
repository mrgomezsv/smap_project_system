import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { detectImageExtension } from './image-type';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
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

    const buffer = this.readValidatedImage(file);
    const ext = detectImageExtension(buffer)!;
    const random = randomBytes(4).toString('hex');
    const filename = `${safeSlug}_${random}${ext}`;
    const absolutePath = join(targetDir, filename);
    writeFileSync(absolutePath, buffer);

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

  /**
   * Guarda una imagen de evento localmente en event_images/ y opcionalmente en Google Drive.
   */
  async saveEventImage(file: Express.Multer.File, title?: string) {
    const rawUploadDir = process.env.UPLOAD_DIR || 'media';
    const uploadDir = rawUploadDir.startsWith('/')
      ? rawUploadDir
      : join(process.cwd(), rawUploadDir);

    const safeTitle = (title || 'evento')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 40);
    const targetDir = join(uploadDir, 'event_images');

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const buffer = this.readValidatedImage(file);
    const ext = detectImageExtension(buffer)!;
    const random = randomBytes(4).toString('hex');
    const filename = `${safeTitle}_${random}${ext}`;
    const absolutePath = join(targetDir, filename);
    writeFileSync(absolutePath, buffer);

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
          `Imagen de evento ${filename} subida exitosamente a Google Drive: ${driveUrl}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `No se pudo subir a Google Drive, manteniendo path local: ${(e as Error).message}`,
      );
    }

    return {
      path: relativePath,
      filename: relativePath,
      localPath: relativePath,
      driveUrl: driveUrl || null,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Lee el contenido del archivo y verifica que sea una imagen real.
   * La extensión final se deriva del contenido, no del nombre original.
   */
  private readValidatedImage(file: Express.Multer.File): Buffer {
    let buffer: Buffer;
    if (file.buffer) {
      buffer = file.buffer;
    } else if (file.path && existsSync(file.path)) {
      buffer = readFileSync(file.path);
    } else {
      throw new BadRequestException('No se recibió contenido del archivo');
    }
    if (!detectImageExtension(buffer)) {
      throw new BadRequestException(
        'El archivo no es una imagen válida (JPG, PNG, WebP, GIF, HEIC, AVIF)',
      );
    }
    return buffer;
  }

  toRelativePath(absolutePath: string, baseDir?: string): string {
    const base = baseDir || this.uploadDir;
    return absolutePath.replace(base + '/', '').replace(base + '\\', '');
  }
}
