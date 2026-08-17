import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { initializeApp, cert, getApp, getApps, App } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: App | null = null;

  async onModuleInit() {
    const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!credentialsPath || !projectId) {
      this.logger.warn(
        'Firebase no inicializado: faltan FIREBASE_CREDENTIALS_PATH o FIREBASE_PROJECT_ID en .env',
      );
      return;
    }

    let absolutePath = path.isAbsolute(credentialsPath)
      ? credentialsPath
      : path.join(process.cwd(), credentialsPath);

    if (!fs.existsSync(absolutePath)) {
      const rootPath = path.join(process.cwd(), '../../', credentialsPath);
      if (fs.existsSync(rootPath)) {
        absolutePath = rootPath;
      } else if (process.env.FIREBASE_CREDENTIALS_BASE64) {
        try {
          const dir = path.dirname(absolutePath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          const decoded = Buffer.from(
            process.env.FIREBASE_CREDENTIALS_BASE64,
            'base64',
          ).toString('utf-8');
          fs.writeFileSync(absolutePath, decoded, 'utf-8');
          this.logger.log(`Credenciales creadas dinámicamente en ${absolutePath}`);
        } catch (e) {
          this.logger.error(
            `Error al decodificar FIREBASE_CREDENTIALS_BASE64: ${(e as Error).message}`,
          );
        }
      } else {
        this.logger.warn(
          `Firebase no inicializado: archivo de credenciales no existe en ${absolutePath}`,
        );
        return;
      }
    }

    try {
      const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
      this.app = getApps().length
        ? getApp()
        : initializeApp({
            credential: cert(serviceAccount),
            projectId,
          });
      this.logger.log(
        `Firebase Admin inicializado correctamente (project: ${projectId})`,
      );
    } catch (error) {
      this.logger.error('Error al inicializar Firebase Admin', error);
    }
  }

  isInitialized(): boolean {
    return this.app !== null;
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    if (!this.app) {
      throw new Error(
        'Firebase no está inicializado. Revisa las credenciales.',
      );
    }
    return getAuth().verifyIdToken(idToken);
  }

  async listUsers(maxResults = 100, pageToken?: string) {
    if (!this.app) {
      return { users: [], pageToken: undefined };
    }
    return getAuth().listUsers(maxResults, pageToken);
  }

  async generatePasswordResetLink(email: string): Promise<string | null> {
    if (!this.app) return null;
    return getAuth().generatePasswordResetLink(email);
  }
}
