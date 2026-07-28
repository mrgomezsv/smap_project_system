import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

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

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromEmail: string;

  constructor() {
    const resendApiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'Kidsfun <onboarding@resend.dev>';

    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
      this.logger.log('EmailService configurado usando Resend API');
    } else if (process.env.SMTP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER ?? this.fromEmail,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      this.logger.log(`Email service configurado vía SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`);
    } else {
      this.logger.warn('Email service en modo dev - Sin RESEND_API_KEY ni SMTP_PASSWORD');
    }
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (this.resend) {
      try {
        const payload: any = {
          from: this.fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        };

        if (options.attachments && options.attachments.length > 0) {
          payload.attachments = options.attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
          }));
        }

        const { data, error } = await this.resend.emails.send(payload);
        if (error) {
          this.logger.error(`Resend API Error al enviar a ${options.to}: ${error.message}`);
          return false;
        }
        this.logger.log(`Email enviado con Resend a ${options.to} - id: ${data?.id}`);
        return true;
      } catch (err: any) {
        this.logger.error(`Excepción enviando con Resend a ${options.to}: ${err.message}`);
        return false;
      }
    }

    if (this.transporter) {
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
        this.logger.log(`Email SMTP enviado a ${options.to} - messageId: ${info.messageId}`);
        return true;
      } catch (error) {
        this.logger.error(`Error enviando email SMTP a ${options.to}: ${(error as Error).message}`);
        return false;
      }
    }

    this.logger.debug(
      `[DEV MODE] Simulación envío email a ${options.to}: "${options.subject}"`,
    );
    return true;
  }

  /**
   * Genera la plantilla HTML bilingüe (ES / EN) para confirmación y reenvío de Waiver
   */
  getWaiverEmailTemplate(data: {
    userName: string;
    qrCode: string;
    pdfDownloadUrl?: string;
    lang?: 'es' | 'en';
  }): { subject: string; html: string } {
    const isEn = data.lang === 'en';

    const subject = isEn
      ? `🎉 Your Kidsfun Waiver Code: ${data.qrCode}`
      : `🎉 Tu Código de Waiver Kidsfun: ${data.qrCode}`;

    const title = isEn ? 'Kidsfun Waiver Confirmation' : 'Confirmación de Waiver Kidsfun';
    const greeting = isEn ? `Hello ${data.userName},` : `Hola ${data.userName},`;
    const message = isEn
      ? 'Thank you for completing your waiver. Below is your entry QR code and access details for the event.'
      : 'Gracias por completar tu exención de responsabilidad (waiver). A continuación encuentras tu código QR de acceso y detalles para el evento.';
    const qrLabel = isEn ? 'Your Entry QR Code:' : 'Tu Código QR de Entrada:';
    const attachmentNote = isEn
      ? '📎 Attached to this email you will find your official PDF Waiver document.'
      : '📎 Adjunto a este correo encontrarás tu documento PDF oficial de Waiver.';
    const helpText = isEn
      ? 'If you have any questions, please contact our support team.'
      : 'Si tienes alguna duda, no dudes en contactar a nuestro equipo de soporte.';
    const footerText = `© ${new Date().getFullYear()} Kidsfun y Fiestas Infantiles. All rights reserved.`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; text-align: left; line-height: 1.6; }
    .qr-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .qr-code { font-size: 32px; font-weight: 900; font-family: monospace; color: #1E3A8A; letter-spacing: 2px; }
    .note-box { background: #eff6ff; border-left: 4px solid #3B82F6; padding: 16px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #1e40af; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Kidsfun</h1>
      <p style="margin:4px 0 0 0; opacity:0.9; font-size:14px;">${title}</p>
    </div>
    <div class="content">
      <h2 style="margin-top:0; font-size:18px; color:#0f172a;">${greeting}</h2>
      <p style="color:#475569;">${message}</p>
      
      <div class="qr-box">
        <p style="margin:0 0 8px 0; font-size:13px; text-transform:uppercase; color:#64748b; font-weight:700;">${qrLabel}</p>
        <div class="qr-code">${data.qrCode}</div>
      </div>

      <div class="note-box">
        ${attachmentNote}
      </div>

      <p style="font-size:14px; color:#64748b; margin-top:24px;">${helpText}</p>
    </div>
    <div class="footer">
      ${footerText}
    </div>
  </div>
</body>
</html>
    `;

    return { subject, html };
  }
}
