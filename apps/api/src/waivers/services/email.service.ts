import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { DEFAULT_WAIVER_TEXT, DEFAULT_WAIVER_TEXT_EN } from './pdf.service';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
  content_id?: string;
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
          payload.attachments = options.attachments.map((a: any) => ({
            filename: a.filename,
            content: a.content,
            content_id: a.content_id || a.contentId,
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
    userEmail?: string;
    userPhone?: string;
    relatives?: Array<{ name: string; age?: number }>;
    createdAt?: Date;
  }): { subject: string; html: string } {
    const isEn = data.lang === 'en';

    const subject = isEn
      ? `🎉 Your Kidsfun Waiver Code: ${data.qrCode}`
      : `🎉 Tu Código de Waiver Kidsfun: ${data.qrCode}`;

    const title = isEn ? 'Kidsfun Waiver Confirmation' : 'Confirmación de Waiver Kidsfun';
    const greeting = isEn ? `Hello ${data.userName},` : `Hola ${data.userName},`;
    const message = isEn
      ? 'Thank you for completing your waiver. Below is your entry QR code and access details for the event.'
      : 'Gracias por completar tu exención de responsabilidad (waiver). A continuación encuentras tu código QR de acceso y el resumen de la información registrada.';
    const qrLabel = isEn ? 'Your Entry QR Code:' : 'Tu Código QR de Entrada:';
    const attachmentNote = isEn
      ? '📄 <strong>Attached Document:</strong> Attached to this email you will find your official PDF Waiver document.'
      : '📄 <strong>Documento Adjunto:</strong> Adjunto a este correo encontrarás tu documento PDF oficial de Waiver para guardar en tu archivo.';
    const helpText = isEn
      ? 'If you have any questions, please contact our support team.'
      : 'Si tienes alguna duda, no dudes en contactar a nuestro equipo de soporte.';
    const footerText = `© ${new Date().getFullYear()} Kidsfun y Fiestas Infantiles. All rights reserved.`;

    const formattedDate = (data.createdAt || new Date()).toLocaleDateString(isEn ? 'en-US' : 'es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const relativesHtml = data.relatives && data.relatives.length > 0
      ? data.relatives.map(r => `• ${r.name}${r.age ? ` (${r.age} ${isEn ? 'years' : 'años'})` : ''}`).join('<br/>')
      : (isEn ? 'None registered' : 'Ninguno registrado');

    /**
     * Bloque bilingüe de Política de Privacidad.
     * Siempre se incluyen ambos idiomas para que el cliente conserve ambas versiones.
     */
    const privacyBlock = `
      <div style="margin-top:32px; padding:20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
        <h3 style="margin:0 0 8px 0; font-size:15px; color:#0f172a;">
          📜 ${isEn ? 'Privacy Policy (Bilingual)' : 'Política de Privacidad (Bilingüe)'}
        </h3>
        <p style="margin:0 0 14px 0; font-size:12px; color:#64748b;">
          ${isEn
            ? 'For your reference, you will find the privacy policy in both Spanish and English below.'
            : 'Para su referencia, encontrará la política de privacidad en español y en inglés a continuación.'}
        </p>

        <div style="margin-bottom:18px;">
          <div style="font-weight:700; color:#1E3A8A; font-size:13px; margin-bottom:6px;">
            🇲🇽 Español (ES)
          </div>
          <div style="white-space:pre-wrap; font-size:12px; line-height:1.5; color:#334155; max-height:280px; overflow:auto; padding:12px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px;">${this.escapeHtml(DEFAULT_WAIVER_TEXT)}</div>
        </div>

        <div>
          <div style="font-weight:700; color:#1E3A8A; font-size:13px; margin-bottom:6px;">
            🇺🇸 English (EN)
          </div>
          <div style="white-space:pre-wrap; font-size:12px; line-height:1.5; color:#334155; max-height:280px; overflow:auto; padding:12px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px;">${this.escapeHtml(DEFAULT_WAIVER_TEXT_EN)}</div>
        </div>
      </div>
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; text-align: left; line-height: 1.6; }
    .qr-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .qr-code { font-size: 32px; font-weight: 900; font-family: monospace; color: #1E3A8A; letter-spacing: 2px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 10px; overflow: hidden; }
    .details-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .details-table td.label { font-weight: 700; color: #475569; width: 40%; background: #f1f5f9; }
    .details-table tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 20px; }
    .note-box { background: #eff6ff; border-left: 4px solid #3B82F6; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #1e40af; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size:32px; font-weight:900; letter-spacing:-0.5px;">Kidsfun</h1>
      <p style="margin:4px 0 0 0; opacity:0.9; font-size:14px; font-weight: 500;">${title}</p>
    </div>
    <div class="content">
      <h2 style="margin-top:0; font-size:18px; color:#0f172a;">${greeting}</h2>
      <p style="color:#475569;">${message}</p>
      
      <div class="qr-box">
        <p style="margin:0 0 8px 0; font-size:12px; text-transform:uppercase; color:#64748b; font-weight:700;">${qrLabel}</p>
        <div class="qr-code">${data.qrCode}</div>
        <div style="margin-top:8px;"><span class="badge">${isEn ? 'ACTIVE / VERIFIED' : 'ACTIVO / VERIFICADO'}</span></div>
      </div>

      <h3 style="font-size:15px; color:#0f172a; margin-bottom:10px;">📋 ${isEn ? 'Registered Waiver Details:' : 'Resumen de Información Registrada:'}</h3>
      <table class="details-table">
        <tr>
          <td class="label">${isEn ? 'Main Adult / Holder:' : 'Titular / Adulto:'}</td>
          <td>${data.userName}</td>
        </tr>
        ${data.userEmail ? `
        <tr>
          <td class="label">${isEn ? 'Email:' : 'Correo Electrónico:'}</td>
          <td>${data.userEmail}</td>
        </tr>` : ''}
        ${data.userPhone ? `
        <tr>
          <td class="label">${isEn ? 'Phone:' : 'Teléfono:'}</td>
          <td>${data.userPhone}</td>
        </tr>` : ''}
        <tr>
          <td class="label">${isEn ? 'Registered Minors:' : 'Menores Registrados:'}</td>
          <td>${relativesHtml}</td>
        </tr>
        <tr>
          <td class="label">${isEn ? 'Registration Date:' : 'Fecha de Registro:'}</td>
          <td>${formattedDate}</td>
        </tr>
      </table>

      <div class="note-box">
        ${attachmentNote}
      </div>

      <p style="font-size:14px; color:#64748b; margin-top:24px;">${helpText}</p>

      ${privacyBlock}
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

  /**
   * Escapa caracteres HTML para evitar inyección cuando se inserta
   * texto de políticas de privacidad (con caracteres como &, <, >, ") en HTML.
   */
  /**
   * Escapa caracteres HTML para evitar inyección cuando se inserta
   * texto de políticas de privacidad (con caracteres como &, <, >, ") en HTML.
   */
  private escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Envía correo electrónico HTML de restablecimiento de contraseña con marca Kidsfun vía Resend / SMTP.
   */
  async sendPasswordReset(to: string, resetLink: string, lang: 'es' | 'en' = 'es'): Promise<boolean> {
    const isEn = lang === 'en';
    const subject = isEn
      ? 'Reset your password — Kidsfun and Kids Parties'
      : 'Restablece tu contraseña — Kidsfun y Fiestas Infantiles';

    const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #172554 100%); padding: 32px 24px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .body { padding: 32px 24px; text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; }
    .text { font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 28px 0; text-align: left; }
    .btn { display: inline-block; background-color: #1E3A8A; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3); }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .warning { margin-top: 24px; padding: 12px 16px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; font-size: 12px; color: #92400e; text-align: left; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Kidsfun y Fiestas Infantiles</h1>
    </div>
    <div class="body">
      <div class="icon">🔑</div>
      <h2 class="title">${isEn ? 'Password Reset Request' : 'Solicitud de Restablecimiento de Contraseña'}</h2>
      <p class="text">
        ${isEn
          ? 'We received a request to reset your password for your Kidsfun account. Click the button below to choose a new password:'
          : 'Recibimos una solicitud para restablecer la contraseña de tu cuenta en Kidsfun. Haz clic en el botón a continuación para elegir una nueva contraseña:'}
      </p>
      <div style="margin: 28px 0;">
        <a href="${resetLink}" class="btn" target="_blank">
          ${isEn ? 'Reset My Password' : 'Restablecer mi Contraseña'}
        </a>
      </div>
      <div class="warning">
        <strong>${isEn ? 'Security Notice:' : 'Nota de Seguridad:'}</strong>
        ${isEn
          ? 'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.'
          : 'Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña no cambiará.'}
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Kidsfun y Fiestas Infantiles. ${isEn ? 'All rights reserved.' : 'Todos los derechos reservados.'}
    </div>
  </div>
</body>
</html>
    `;

    return this.send({ to, subject, html });
  }
}
