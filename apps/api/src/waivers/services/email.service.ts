import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * Servicio de envío de emails vía SMTP.
 * Reemplaza el django.core.mail del proyecto anterior.
 *
 * Configuración por env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL
 *
 * Si SMTP_PASSWORD no está configurado, el servicio entra en modo "dev"
 * donde loguea el email en consola en lugar de enviarlo.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromEmail: string;

  constructor() {
    this.fromEmail = process.env.SMTP_FROM_EMAIL ?? 'kidsfun.developer@gmail.com';

    if (process.env.SMTP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER ?? this.fromEmail,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      this.logger.log(`Email service configurado (SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`);
    } else {
      this.logger.warn('Email service en modo dev - SMTP_PASSWORD no configurado');
    }
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.debug(
        `[DEV MODE] Email no enviado a ${options.to}: "${options.subject}"\n${options.html.substring(0, 200)}...`,
      );
      if (options.attachments) {
        this.logger.debug(`[DEV MODE] Adjuntos: ${options.attachments.length}`);
      }
      return true; // simular éxito en dev
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });
      this.logger.log(`Email enviado a ${options.to} - messageId: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error enviando email a ${options.to}: ${(error as Error).message}`);
      return false;
    }
  }
}
