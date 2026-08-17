import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive: ReturnType<typeof google.drive> | null = null;
  private readonly folderId: string;

  constructor() {
    this.folderId =
      process.env.GOOGLE_DRIVE_FOLDER_ID || '1_5uQEdZB83g8rPnVglKjK0L9RN3Gk8Qo';
    this.initDrive();
  }

  private initDrive() {
    try {
      const credPathRelative =
        process.env.FIREBASE_CREDENTIALS_PATH ||
        'credentials/smap-kf-firebase-adminsdk-xqq0l-42c4ee6425.json';
      const credPath = credPathRelative.startsWith('/')
        ? credPathRelative
        : join(process.cwd(), credPathRelative);

      if (!existsSync(credPath)) {
        this.logger.warn(
          `Archivo de credenciales de Google no encontrado en ${credPath}. Fallback a almacenamiento local.`,
        );
        return;
      }

      const credentials = JSON.parse(readFileSync(credPath, 'utf8'));

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.logger.log(
        `Google Drive Service inicializado con folder: ${this.folderId}`,
      );
    } catch (e) {
      this.logger.error(
        `Error al inicializar Google Drive Service: ${(e as Error).message}`,
      );
    }
  }

  /**
   * Sube un archivo a la carpeta de Google Drive y configura permisos de lectura pública.
   */
  async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<{ fileId: string; webViewLink: string; webContentLink: string } | null> {
    if (!this.drive) {
      this.logger.warn(
        'Google Drive no está inicializado. Se omite subida a Google Drive.',
      );
      return null;
    }

    try {
      const bufferStream = new Readable();
      bufferStream.push(fileBuffer);
      bufferStream.push(null);

      const response = await this.drive.files.create({
        requestBody: {
          name: filename,
          parents: [this.folderId],
        },
        media: {
          mimeType,
          body: bufferStream,
        },
        fields: 'id, webViewLink, webContentLink',
      });

      const fileId = response.data.id;
      if (!fileId) return null;

      // Asignar permisos de lectura pública para poder incrustar la imagen en el sitio web
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      const publicUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

      return {
        fileId,
        webViewLink: publicUrl,
        webContentLink: response.data.webContentLink || publicUrl,
      };
    } catch (e) {
      this.logger.error(
        `Error al subir archivo ${filename} a Google Drive: ${(e as Error).message}`,
      );
      return null;
    }
  }
}
