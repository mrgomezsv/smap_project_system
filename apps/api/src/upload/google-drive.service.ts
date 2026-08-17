import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive: ReturnType<typeof google.drive> | null = null;
  private readonly parentFolderId: string;
  private projectFolderId: string | null = null;

  constructor() {
    this.parentFolderId =
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

      let credentials: any;
      if (!existsSync(credPath)) {
        if (process.env.FIREBASE_CREDENTIALS_BASE64) {
          try {
            const decoded = Buffer.from(
              process.env.FIREBASE_CREDENTIALS_BASE64,
              'base64',
            ).toString('utf-8');
            credentials = JSON.parse(decoded);
          } catch (e) {
            this.logger.error(
              `Error al decodificar FIREBASE_CREDENTIALS_BASE64 en GoogleDriveService: ${(e as Error).message}`,
            );
            return;
          }
        } else {
          this.logger.warn(
            `Archivo de credenciales de Google no encontrado en ${credPath}. Fallback a almacenamiento local.`,
          );
          return;
        }
      } else {
        credentials = JSON.parse(readFileSync(credPath, 'utf8'));
      }

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.logger.log(
        `Google Drive Service inicializado (Carpeta raíz: ${this.parentFolderId})`,
      );
    } catch (e) {
      this.logger.error(
        `Error al inicializar Google Drive Service: ${(e as Error).message}`,
      );
    }
  }

  /**
   * Obtiene o crea automáticamente la subcarpeta (ej: 'kidsfun') dentro de ProyectosDocker
   */
  async getOrCreateProjectFolder(folderName = 'kidsfun'): Promise<string> {
    if (this.projectFolderId) {
      return this.projectFolderId;
    }

    if (!this.drive) {
      return this.parentFolderId;
    }

    try {
      // Buscar si ya existe la carpeta 'kidsfun' dentro de ProyectosDocker
      const searchRes = await this.drive.files.list({
        q: `'${this.parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
      });

      if (searchRes.data.files && searchRes.data.files.length > 0) {
        const foundId = searchRes.data.files[0].id!;
        this.projectFolderId = foundId;
        this.logger.log(`Subcarpeta '${folderName}' encontrada (ID: ${foundId})`);
        return foundId;
      }

      // Si no existe, crear la subcarpeta 'kidsfun'
      this.logger.log(
        `Subcarpeta '${folderName}' no encontrada en ProyectosDocker. Creándola...`,
      );
      const createRes = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [this.parentFolderId],
        },
        fields: 'id',
      });

      const newFolderId = createRes.data.id!;
      this.projectFolderId = newFolderId;

      // Asignar permisos de lectura a la carpeta creada
      await this.drive.permissions.create({
        fileId: newFolderId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      this.logger.log(
        `Subcarpeta '${folderName}' creada exitosamente en ProyectosDocker (ID: ${newFolderId})`,
      );
      return newFolderId;
    } catch (e) {
      this.logger.error(
        `Error al buscar/crear subcarpeta '${folderName}': ${(e as Error).message}. Se usará la carpeta raíz.`,
      );
      return this.parentFolderId;
    }
  }

  /**
   * Sube un archivo dentro de ProyectosDocker/kidsfun/ y configura permisos de lectura pública.
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
      // Obtener o crear la subcarpeta 'kidsfun' dentro de ProyectosDocker
      const targetFolderId = await this.getOrCreateProjectFolder('kidsfun');

      const bufferStream = new Readable();
      bufferStream.push(fileBuffer);
      bufferStream.push(null);

      const response = await this.drive.files.create({
        requestBody: {
          name: filename,
          parents: [targetFolderId],
        },
        media: {
          mimeType,
          body: bufferStream,
        },
        fields: 'id, webViewLink, webContentLink',
      });

      const fileId = response.data.id;
      if (!fileId) return null;

      // Asignar permisos de lectura pública para poder mostrar la imagen en la web
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
