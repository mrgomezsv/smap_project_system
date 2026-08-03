import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join, relative, resolve, sep } from 'path';
import { randomBytes } from 'crypto';

/**
 * Servicio de upload de archivos.
 * Los archivos se guardan en `${UPLOAD_DIR}/product_images/<random>.<ext>`.
 * El frontend debe componer la URL pública con `${MEDIA_URL}/media/<path>`.
 */
@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly maxSize: number;

  constructor() {
    this.uploadDir = resolve(process.env.UPLOAD_DIR ?? join(process.cwd(), 'media'));
    this.maxSize = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10) * 1024 * 1024;
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  createFilename(extension: string): string {
    return `${randomBytes(16).toString('hex')}${extension.toLowerCase()}`;
  }

  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Helper para convertir path absoluto a URL relativa (lo que se guarda en BD).
   */
  toRelativePath(absolutePath: string, baseDir?: string): string {
    const base = resolve(baseDir ?? this.uploadDir);
    const file = resolve(absolutePath);
    const path = relative(base, file);
    if (!path || path === '..' || path.startsWith(`..${sep}`)) {
      throw new Error('Ruta de archivo fuera del directorio de uploads');
    }
    return path.split(sep).join('/');
  }
}
