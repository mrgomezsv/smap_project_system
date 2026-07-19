import { Injectable, Logger } from '@nestjs/common';
import { getMessaging, Message } from 'firebase-admin/messaging';
import { FirebaseService } from '../auth/firebase.service';

/**
 * Servicio para envío de Push Notifications vía Firebase Cloud Messaging.
 * Equivalente al send_push_notification() del Django.
 *
 * Usa firebase-admin para enviar a un token específico de dispositivo.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async sendToToken(token: string, title: string, body: string, imageUrl?: string): Promise<string> {
    if (!this.firebaseService.isInitialized()) {
      this.logger.debug(
        `[DEV MODE] Push no enviado a token ${token.substring(0, 10)}...: "${title}" - "${body}"`,
      );
      return 'dev-message-id';
    }

    try {
      const message: Message = {
        notification: {
          title,
          body,
          ...(imageUrl ? { imageUrl } : {}),
        },
        token,
      };
      const messageId = await getMessaging().send(message);
      this.logger.log(`Push enviado a ${token.substring(0, 10)}... - messageId: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error(`Error enviando push: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.firebaseService.isInitialized()) {
      this.logger.debug(`[DEV MODE] Push no enviado a topic ${topic}: "${title}"`);
      return 'dev-message-id';
    }
    try {
      const messageId = await getMessaging().send({
        notification: { title, body },
        topic,
        data,
      });
      this.logger.log(`Push enviado a topic ${topic} - messageId: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error(`Error enviando push a topic: ${(error as Error).message}`);
      throw error;
    }
  }
}
