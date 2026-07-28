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
      // Fallback: buscar desde la raíz del monorepo si process.cwd() es apps/api
      const rootPath = path.join(process.cwd(), '../../', credentialsPath);
      if (fs.existsSync(rootPath)) {
        absolutePath = rootPath;
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
      this.logger.log(`Firebase Admin inicializado correctamente (project: ${projectId})`);
    } catch (error) {
      this.logger.error('Error al inicializar Firebase Admin', error);
    }
  }

  isInitialized(): boolean {
    return this.app !== null;
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    if (!this.app) {
      throw new Error('Firebase no está inicializado. Revisa las credenciales.');
    }
    return getAuth().verifyIdToken(idToken);
  }

  async listUsers(maxResults = 100, pageToken?: string) {
    if (!this.app) {
      return { users: [], pageToken: undefined };
    }
    return getAuth().listUsers(maxResults, pageToken);
  }
}
