import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { QrService } from './qr.service';

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

  async generateWaiverPdf(data: WaiverPdfData): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();

    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    // === HEADER: Logo - Título - QR (3 columnas) ===
    const qrImage = await this.qrService.toBuffer(data.qrCode);
    const qrPic = await doc.embedPng(qrImage);
    const qrDim = { width: 80, height: 80 };

    // Logo placeholder (texto) en columna izquierda
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

    // Título centrado
    page.drawText('DOCUMENTO DE EXENCIÓN DE', {
      x: margin + 110,
      y: y - 15,
      size: 12,
      font: helveticaBold,
      color: this.primary,
    });
    page.drawText('RESPONSABILIDAD (WAIVER)', {
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
    page.drawText('INFORMACIÓN DE REGISTRO', {
      x: margin,
      y: y,
      size: 12,
      font: helveticaBold,
      color: this.primary,
    });
    y -= 25;

    const fechaStr = data.createdAt.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    page.drawText(`FECHA: ${fechaStr}`, { x: margin, y, size: 10, font: helveticaBold });
    y -= 18;
    page.drawText(`CLIENTE / RESPONSABLE: ${data.userName}`, { x: margin, y, size: 10, font: helvetica });
    y -= 18;
    page.drawText(`ID: ${data.userId}`, { x: margin, y, size: 10, font: helvetica });
    y -= 18;
    page.drawText(`EMAIL: ${data.userEmail}`, { x: margin, y, size: 10, font: helvetica });
    if (data.userPhone) {
      y -= 18;
      page.drawText(`TELÉFONO: ${data.userPhone}`, { x: margin, y, size: 10, font: helvetica });
    }
    y -= 30;

    // === FAMILIARES ===
    if (data.relatives.length > 0) {
      page.drawText('FAMILIARES Y ACOMPAÑANTES REGISTRADOS', {
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
      page.drawText('Nombre del Familiar', {
        x: tableX + 8,
        y: y - 14,
        size: 11,
        font: helveticaBold,
        color: this.primary,
      });
      page.drawText('Edad', {
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

    // === TÉRMINOS Y CONDICIONES ===
    if (data.legalText) {
      page.drawText('TÉRMINOS Y CONDICIONES', {
        x: margin,
        y,
        size: 12,
        font: helveticaBold,
        color: this.primary,
      });
      y -= 18;

      // Texto legal envuelto (line wrapping simple)
      const maxWidth = width - 2 * margin;
      const lines = this.wrapText(data.legalText, maxWidth, helvetica, 9);
      for (const line of lines) {
        if (y < margin + 100) break; // dejar espacio para firmas
        page.drawText(line, { x: margin, y, size: 9, font: helvetica });
        y -= 12;
      }
      y -= 15;
    }

    // === FIRMAS ===
    if (y > margin + 80) {
      page.drawText('ACEPTACIÓN Y FIRMA', {
        x: margin,
        y,
        size: 12,
        font: helveticaBold,
        color: this.primary,
      });
      y -= 50;

      page.drawLine({
        start: { x: margin, y },
        end: { x: margin + 230, y },
        thickness: 0.5,
        color: this.gray,
      });
      page.drawLine({
        start: { x: width / 2 + 20, y },
        end: { x: width - margin, y },
        thickness: 0.5,
        color: this.gray,
      });

      page.drawText('Firma del Cliente / Responsable', {
        x: margin,
        y: y - 12,
        size: 9,
        font: helvetica,
      });
      page.drawText('Firma de Padre o Tutor (si aplica)', {
        x: width / 2 + 20,
        y: y - 12,
        size: 9,
        font: helvetica,
      });
    }

    // === FOOTER ===
    page.drawText(
      `Este documento fue generado electrónicamente el ${data.createdAt.toLocaleString('es-ES')}.`,
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
  private wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
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
