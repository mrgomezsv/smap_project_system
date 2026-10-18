import { Injectable, Logger } from '@nestjs/common';
import { getMessaging, Message } from 'firebase-admin/messaging';
import { FirebaseService } from '../auth/firebase.service';
import { PrismaService } from '../prisma/prisma.service';

export type PushSegment = 'all' | 'event-attendees';

/** Errores de FCM que indican un token que ya no sirve. */
const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/**
 * Servicio para envío de Push Notifications vía Firebase Cloud Messaging.
 * Equivalente al send_push_notification() del Django.
 *
 * Usa firebase-admin para enviar a un token específico de dispositivo.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly prisma: PrismaService,
  ) {}

  /** Crea o reasigna un token FCM al usuario actual y lo marca activo. */
  async registerToken(userId: string, token: string, platform: string) {
    await this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform, isActive: true, lastUsedAt: new Date() },
    });
    return { ok: true };
  }

  /**
   * Envía una notificación a todos los tokens activos del segmento.
   * - all: todos los dispositivos registrados
   * - event-attendees: usuarios que han generado al menos un waiver
   * Desactiva los tokens que FCM reporta como inválidos.
   */
  async sendToSegment(
    segment: PushSegment,
    title: string,
    body: string,
  ): Promise<{ count: number; failed: number; total: number }> {
    let userFilter: { userId?: { in: string[] } } = {};
    if (segment === 'event-attendees') {
      const owners = await this.prisma.waiverQRV2.findMany({
        select: { userId: true },
        distinct: ['userId'],
      });
      userFilter = { userId: { in: owners.map((o) => o.userId) } };
    }
    const rows = await this.prisma.pushToken.findMany({
      where: { isActive: true, ...userFilter },
      select: { token: true },
    });
    const tokens = rows.map((r) => r.token);
    if (tokens.length === 0) return { count: 0, failed: 0, total: 0 };

    if (!this.firebaseService.isInitialized()) {
      this.logger.debug(`[DEV MODE] Push no enviado a ${tokens.length} tokens`);
      return { count: 0, failed: 0, total: tokens.length };
    }

    let success = 0;
    const invalid: string[] = [];
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      const res = await getMessaging().sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
      });
      success += res.successCount;
      res.responses.forEach((r, idx) => {
        if (!r.success && r.error && INVALID_TOKEN_CODES.has(r.error.code)) {
          invalid.push(batch[idx]);
        }
      });
    }
    if (invalid.length > 0) {
      await this.prisma.pushToken.updateMany({
        where: { token: { in: invalid } },
        data: { isActive: false },
      });
    }
    this.logger.log(
      `Push "${title}" (${segment}): ${success}/${tokens.length} enviados`,
    );
    return { count: success, failed: tokens.length - success, total: tokens.length };
  }

  async sendToToken(
    token: string,
    title: string,
    body: string,
    imageUrl?: string,
  ): Promise<string> {
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
      this.logger.log(
        `Push enviado a ${token.substring(0, 10)}... - messageId: ${messageId}`,
      );
      return messageId;
    } catch (error) {
      this.logger.error(`Error enviando push: ${(error as Error).message}`);
      throw error;
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!this.firebaseService.isInitialized()) {
      this.logger.debug(
        `[DEV MODE] Push no enviado a topic ${topic}: "${title}"`,
      );
      return 'dev-message-id';
    }
    try {
      const messageId = await getMessaging().send({
        notification: { title, body },
        topic,
        data,
      });
      this.logger.log(
        `Push enviado a topic ${topic} - messageId: ${messageId}`,
      );
      return messageId;
    } catch (error) {
      this.logger.error(
        `Error enviando push a topic: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
