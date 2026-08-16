import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { QrService } from './qr.service';

export const DEFAULT_WAIVER_TEXT = `REGLAS DE SEGURIDAD Y RESPONSABILIDADES PARA INFLATABLES

1) No consumir alimentos, bebidas o chicles dentro ni cerca del Inflable. Esto evita riesgo de asfixia y mantiene el equipo limpio.
2) Calzado, anteojos, joyas y objetos punzantes DEBEN retirarse antes de ingresar al inflable para evitar lesiones.
3) NO usar pintura facial, confeti ni serpentinas en aerosol (Silly String) cerca del equipo.
4) Solo 1 persona a la vez en la parte superior de resbaladeros acuáticos (2 en carril doble), máximo 6 niños en el brincolín.
5) Queda estrictamente prohibido escalar, colgarse o sentarse en las paredes o bordes del inflable.
6) Se requiere supervisión constante de un Adulto responsable (18+) en todo momento durante el uso del equipo.
7) No permitir empujones, piruetas, volteletas, giros peligrosos ni juegos bruscos dentro del equipo.
8) No ingresar mascotas, juguetes ni objetos afilados al inflable en ningún momento.
9) No permitir que nadie salte en el escalón de seguridad frontal ya que es peligroso.
10) Si el soplador/motor se apaga, asegúrese de que todos los usuarios bajen con calma.
11) REGLA MÁS IMPORTANTE: NO permitir que los niños jueguen en el inflable sin supervisión de un Adulto.

EXENCIÓN DE RESPONSABILIDAD CIVIL Y ACEPTACIÓN
1) El cliente / titular declara que ha leído, comprendido y aceptado todas las reglas de seguridad anteriores.
2) El equipo se recibe en buenas condiciones y debe ser utilizado adecuadamente.
3) El cliente acuerda garantizar que todos los usuarios y tutores lean y comprendan las reglas de seguridad.
4) El titular exonera a Kidsfun y Fiestas Infantiles de toda responsabilidad civil, daños o reclamos derivados del uso del equipo o falta de supervisión adulta durante el evento.`;

/**
 * Traducción al inglés del texto legal por defecto de exención de responsabilidad.
 * Se incluye en el PDF y el email para que el cliente tenga ambas versiones.
 */
export const DEFAULT_WAIVER_TEXT_EN = `SAFETY RULES & RESPONSIBILITIES FOR INFLATABLES

1) No food, drink or chewing gum on or around the Inflatable. This avoids choking risk and keeps unit clean.
2) Shoes, glasses, jewelry, and badges MUST be removed before using the inflatable to avoid injury.
3) NO face paints, party poppers, colored streamers or SILLY STRING to be used on or near the Inflatable.
4) Only 1 rider allowed at top of water slide at a time (2 for double lane), max 6 riders per bounce house.
5) Climbing, hanging or sitting on inflatable walls is dangerous and strictly prohibited.
6) A responsible Adult (18+) must supervise the inflatable at all times.
7) Ensure children are not pushing, colliding, fighting or behaving in a manner likely to cause distress.
8) No pets, toys or sharp instruments on the inflatable at any time.
9) Do not allow anyone to bounce on the front safety step as this is dangerous.
10) If blower stops, ensure users get off calmly. Check fuses and power before contacting support.
11) MOST IMPORTANT RULE: DO NOT let children play on the inflatable without Adult supervision.

LIABILITY DISCLAIMER & ACCEPTANCE
1) Customer agrees to ensure all users and guardians read and understand all safety rules.
2) Equipment received in good condition and must be operated in accordance with safety instructions.
3) Lessee holds company (Kidsfun y Fiestas Infantiles) harmless from any claims, suits, damages or liabilities from equipment use or lack of adult supervision.`;

/**
 * Interface con los datos del waiver para generar el PDF.
 */
export interface WaiverPdfData {
  qrCode: string;
  userName: string;
  userId: string;
  userEmail: string;
  userPhone?: string | null;
  createdAt: Date;
  expiresAt?: Date | null;
  relatives: Array<{ name: string; age: number }>;
  legalText?: string;
}

/**
 * Servicio de generación de PDFs para waivers.
 * Equivalente al create_waiver_pdf_buffer() de Django/reportlab.
 *
 * Layout: 3 columnas (Logo | Títulos | QR), tabla de familiares,
 * texto legal y sección de firmas.
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  // Paleta de colores (basada en la guía visual Kidsfun)
  private readonly primary = rgb(0.118, 0.227, 0.541); // #1E3A8A
  private readonly headerBg = rgb(0.961, 0.227, 0.106); // amarillo gold #F5A91B
  private readonly gray = rgb(0.5, 0.5, 0.5);
  private readonly lightGray = rgb(0.95, 0.96, 0.97);

  constructor(private readonly qrService: QrService) {}

  async generateWaiverPdf(
    data: WaiverPdfData,
    lang: string = 'es',
  ): Promise<Uint8Array> {
    const isEn = lang === 'en';
    const t = {
      title1: isEn ? 'WAIVER OF LIABILITY' : 'DOCUMENTO DE EXENCIÓN DE',
      title2: isEn ? 'DOCUMENT' : 'RESPONSABILIDAD (WAIVER)',
      regInfo: isEn ? 'REGISTRATION INFORMATION' : 'INFORMACIÓN DE REGISTRO',
      dateStr: isEn ? 'ISSUE DATE:' : 'FECHA DE EMISIÓN:',
      expStr: isEn ? 'VALID UNTIL:' : 'VIGENCIA HASTA:',
      client: isEn ? 'CLIENT / RESPONSIBLE:' : 'CLIENTE / RESPONSABLE:',
      phone: isEn ? 'PHONE:' : 'TELÉFONO:',
      famTitle: isEn
        ? 'REGISTERED FAMILY AND COMPANIONS'
        : 'FAMILIARES Y ACOMPAÑANTES REGISTRADOS',
      famName: isEn ? 'Relative Name' : 'Nombre del Familiar',
      famAge: isEn ? 'Age' : 'Edad',
      signTitle: isEn ? 'ACCEPTANCE AND SIGNATURE' : 'ACEPTACIÓN Y FIRMA',
      sign1: isEn
        ? 'Signature of Client / Responsible'
        : 'Firma del Cliente / Responsable',
      sign2: isEn
        ? 'Signature of Parent or Guardian (if applicable)'
        : 'Firma de Padre o Tutor (si aplica)',
      footer: isEn
        ? `This document was generated electronically on `
        : `Este documento fue generado electrónicamente el `,
    };

    const doc = await PDFDocument.create();
    let page = doc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();

    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    // === MARCA DE AGUA (FAVICON) AL CENTRO DEL PDF ===
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const watermarkPath = path.join(
        process.cwd(),
        'apps/api/src/assets/favicon-watermark.png',
      );
      const watermarkBuffer = await fs.readFile(watermarkPath);
      const watermarkPic = await doc.embedPng(watermarkBuffer);

      const watermarkWidth = 280;
      const watermarkHeight = 280;

      page.drawImage(watermarkPic, {
        x: (width - watermarkWidth) / 2,
        y: (height - watermarkHeight) / 2,
        width: watermarkWidth,
        height: watermarkHeight,
        opacity: 0.1, // Marca de agua tenue/sutil
      });
    } catch (e) {
      this.logger.warn(
        'No se pudo cargar la marca de agua del favicon para el PDF',
      );
    }

    // === HEADER: Logo - Título - QR (3 columnas) ===
    const webUrl =
      process.env.PUBLIC_WEB_URL ||
      process.env.SITE_URL ||
      process.env.NEXT_PUBLIC_WEB_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://kidsfunyfiestasinfantiles.com'
        : 'http://localhost:3000');
    const qrTargetUrl = `${webUrl}/waiver/verify/${data.qrCode}`;
    const qrImage = await this.qrService.toBuffer(qrTargetUrl);
    const qrPic = await doc.embedPng(qrImage);
    const qrDim = { width: 80, height: 80 };

    // Logo en columna izquierda
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const logoPath = path.join(process.cwd(), 'apps/api/src/assets/logo.png');
      const logoAltPath = path.join(process.cwd(), 'src/assets/logo.png');

      let logoBuffer: Buffer | null = null;
      try {
        logoBuffer = await fs.readFile(logoPath);
      } catch {
        try {
          logoBuffer = await fs.readFile(logoAltPath);
        } catch {
          this.logger.warn('Logo file not found, falling back to text header');
        }
      }

      if (logoBuffer) {
        const logoPic = await doc.embedPng(logoBuffer);
        page.drawImage(logoPic, {
          x: margin,
          y: y - 55,
          width: 110,
          height: 55,
        });
      } else {
        page.drawText('KIDSFUN', {
          x: margin,
          y: y - 20,
          size: 18,
          font: helveticaBold,
          color: this.primary,
        });
        page.drawText('Fiestas Infantiles', {
          x: margin,
          y: y - 35,
          size: 10,
          font: helvetica,
          color: this.gray,
        });
      }
    } catch (e) {
      this.logger.error('Error embedding logo in PDF:', e);
    }

    // Título centrado
    page.drawText(t.title1, {
      x: margin + 110,
      y: y - 15,
      size: 12,
      font: helveticaBold,
      color: this.primary,
    });
    page.drawText(t.title2, {
      x: margin + 110,
      y: y - 30,
      size: 12,
      font: helveticaBold,
      color: this.primary,
    });

    // QR + código en columna derecha
    page.drawImage(qrPic, {
      x: width - margin - qrDim.width,
      y: y - qrDim.height + 10,
      width: qrDim.width,
      height: qrDim.height,
    });
    page.drawText(data.qrCode, {
      x: width - margin - qrDim.width,
      y: y - qrDim.height - 5,
      size: 10,
      font: helveticaBold,
      color: this.primary,
    });

    y -= qrDim.height + 40;

    // === INFORMACIÓN DE REGISTRO ===
    page.drawText(t.regInfo, {
      x: margin,
      y: y,
      size: 12,
      font: helveticaBold,
      color: this.primary,
    });
    y -= 25;

    const fechaStr = data.createdAt.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    page.drawText(`${t.dateStr} ${fechaStr}`, {
      x: margin,
      y,
      size: 10,
      font: helveticaBold,
    });
    y -= 18;

    if (data.expiresAt) {
      const expStr = new Date(data.expiresAt).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      page.drawText(`${t.expStr} ${expStr}`, {
        x: margin,
        y,
        size: 10,
        font: helveticaBold,
        color: this.primary,
      });
      y -= 18;
    }

    page.drawText(`${t.client} ${data.userName}`, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
    });
    y -= 18;
    page.drawText(`ID: ${data.userId}`, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
    });
    y -= 18;
    page.drawText(`EMAIL: ${data.userEmail}`, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
    });
    if (data.userPhone) {
      y -= 18;
      page.drawText(`${t.phone} ${data.userPhone}`, {
        x: margin,
        y,
        size: 10,
        font: helvetica,
      });
    }
    y -= 30;

    // === FAMILIARES ===
    if (data.relatives.length > 0) {
      page.drawText(t.famTitle, {
        x: margin,
        y,
        size: 12,
        font: helveticaBold,
        color: this.primary,
      });
      y -= 22;

      // Header de tabla
      const tableX = margin;
      const tableWidth = width - 2 * margin;
      const colWidths = [tableWidth * 0.7, tableWidth * 0.3];
      const rowHeight = 22;

      page.drawRectangle({
        x: tableX,
        y: y - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: this.lightGray,
      });
      page.drawText(t.famName, {
        x: tableX + 8,
        y: y - 14,
        size: 11,
        font: helveticaBold,
        color: this.primary,
      });
      page.drawText(t.famAge, {
        x: tableX + colWidths[0] + 8,
        y: y - 14,
        size: 11,
        font: helveticaBold,
        color: this.primary,
      });

      y -= rowHeight;

      // Filas
      for (const rel of data.relatives) {
        page.drawText(rel.name, {
          x: tableX + 8,
          y: y - 14,
          size: 10,
          font: helvetica,
        });
        page.drawText(String(rel.age), {
          x: tableX + colWidths[0] + 8,
          y: y - 14,
          size: 10,
          font: helvetica,
        });
        // Línea inferior
        page.drawLine({
          start: { x: tableX, y: y - rowHeight },
          end: { x: tableX + tableWidth, y: y - rowHeight },
          thickness: 0.5,
          color: this.gray,
        });
        y -= rowHeight;
      }
      y -= 15;
    }

    // === TÉRMINOS Y CONDICIONES (BILINGÜE: ES + EN) ===
    const isPlaceholder =
      !data.legalText ||
      data.legalText.trim().length < 100 ||
      data.legalText.includes('por defecto');
    const spanishText: string = isPlaceholder
      ? DEFAULT_WAIVER_TEXT
      : data.legalText || DEFAULT_WAIVER_TEXT;
    const englishText: string = DEFAULT_WAIVER_TEXT_EN;

    const renderLegalSection = (
      title: string,
      content: string,
      contTitle: string,
    ) => {
      page.drawText(title, {
        x: margin,
        y,
        size: 11,
        font: helveticaBold,
        color: this.primary,
      });
      y -= 16;

      const maxWidth = width - 2 * margin;
      const paragraphs = content.split('\n');

      for (const para of paragraphs) {
        if (!para.trim()) {
          y -= 6;
          continue;
        }
        const lines = this.wrapText(para.trim(), maxWidth, helvetica, 8);
        for (const line of lines) {
          if (y < margin + 90) {
            const newPage = doc.addPage([612, 792]);
            page = newPage;
            y = height - margin;
            page.drawText(contTitle, {
              x: margin,
              y,
              size: 10,
              font: helveticaBold,
              color: this.primary,
            });
            y -= 20;
          }
          page.drawText(line, { x: margin, y, size: 8, font: helvetica });
          y -= 11;
        }
        y -= 4;
      }
      y -= 10;
    };

    if (lang === 'en') {
      renderLegalSection(
        'PRIVACY POLICY AND TERMS (EN)',
        englishText,
        'PRIVACY POLICY AND TERMS (EN) - Continued',
      );
      y -= 6;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 0.6,
        color: this.gray,
      });
      y -= 14;
      renderLegalSection(
        'POLÍTICA DE PRIVACIDAD Y TÉRMINOS (ES)',
        spanishText,
        'POLÍTICA DE PRIVACIDAD Y TÉRMINOS (ES) - Continuación',
      );
    } else {
      renderLegalSection(
        'POLÍTICA DE PRIVACIDAD Y TÉRMINOS (ES)',
        spanishText,
        'POLÍTICA DE PRIVACIDAD Y TÉRMINOS (ES) - Continuación',
      );
      y -= 6;
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 0.6,
        color: this.gray,
      });
      y -= 14;
      renderLegalSection(
        'PRIVACY POLICY AND TERMS (EN)',
        englishText,
        'PRIVACY POLICY AND TERMS (EN) - Continued',
      );
    }

    // === FIRMAS ===
    if (y < margin + 80) {
      const newPage = doc.addPage([612, 792]);
      page = newPage;
      y = height - margin - 40;
    }

    page.drawText(t.signTitle, {
      x: margin,
      y,
      size: 11,
      font: helveticaBold,
      color: this.primary,
    });
    y -= 45;

    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + 220, y },
      thickness: 0.5,
      color: this.gray,
    });
    page.drawLine({
      start: { x: width / 2 + 20, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: this.gray,
    });

    page.drawText(t.sign1, {
      x: margin,
      y: y - 12,
      size: 9,
      font: helvetica,
    });
    page.drawText(t.sign2, {
      x: width / 2 + 20,
      y: y - 12,
      size: 9,
      font: helvetica,
    });

    // === FOOTER ===
    page.drawText(
      `${t.footer}${data.createdAt.toLocaleString(isEn ? 'en-US' : 'es-ES')}.`,
      {
        x: margin,
        y: margin,
        size: 8,
        font: helvetica,
        color: this.gray,
      },
    );

    return doc.save();
  }

  /**
   * Envoltorio simple de texto por ancho.
   */
  private wrapText(
    text: string,
    maxWidth: number,
    font: any,
    fontSize: number,
  ): string[] {
    const words = text.replace(/\n/g, ' ').split(/\s+/);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      const width = font.widthOfTextAtSize(test, fontSize);
      if (width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }
}
