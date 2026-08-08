import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ContractPdfData {
  token: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientAddress: string;
  clientCityStateZip?: string | null;
  driverLicense?: string | null;
  eventDate?: Date | string | null;
  startTime?: string | null;
  endTime?: string | null;
  equipment: string;
  groundType?: string | null;
  price?: number | string | null;
  deposit?: number | string | null;
  notes?: string | null;
  signedAt?: Date | string | null;
  signerIp?: string | null;
  signerUserAgent?: string | null;
  signatureImage?: string | null;
  safetyChecklist?: Record<string, boolean> | null;
}

@Injectable()
export class ContractPdfService {
  private readonly logger = new Logger(ContractPdfService.name);

  private readonly primary = rgb(0.118, 0.227, 0.541); // #1E3A8A
  private readonly brandYellow = rgb(0.96, 0.66, 0.1); // #F5A91B
  private readonly darkText = rgb(0.15, 0.15, 0.15);
  private readonly grayText = rgb(0.4, 0.4, 0.4);
  private readonly lightBg = rgb(0.96, 0.96, 0.98);
  private readonly borderColor = rgb(0.85, 0.85, 0.88);

  async generatePdf(data: ContractPdfData): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

    // Intentar cargar logo / marca de agua si existe
    let logoImage: any = null;
    try {
      const logoPath = path.join(process.cwd(), 'apps/web/public/media/logo.png');
      const logoBuffer = await fs.readFile(logoPath);
      logoImage = await doc.embedPng(logoBuffer);
    } catch {
      // Ignorar si no está presente
    }

    // ==========================================
    // PÁGINA 1: RENTAL AGREEMENT & DISCLAIMER
    // ==========================================
    const page1 = doc.addPage([612, 792]); // Letter
    const { width, height } = page1.getSize();
    const margin = 40;
    let y = height - margin;

    // Header Band
    page1.drawRectangle({
      x: margin,
      y: y - 55,
      width: width - margin * 2,
      height: 55,
      color: this.brandYellow,
      borderColor: this.primary,
      borderWidth: 1.5,
    });

    if (logoImage) {
      page1.drawImage(logoImage, {
        x: margin + 10,
        y: y - 48,
        width: 100,
        height: 40,
      });
    }

    page1.drawText('KIDSFUN & FIESTAS INFANTILES', {
      x: logoImage ? margin + 120 : margin + 15,
      y: y - 25,
      size: 16,
      font: helveticaBold,
      color: this.primary,
    });

    page1.drawText('Rental Agreement & Liability Waiver', {
      x: logoImage ? margin + 120 : margin + 15,
      y: y - 43,
      size: 11,
      font: helveticaBold,
      color: this.darkText,
    });

    y -= 70;

    // Tabla Info Cliente
    page1.drawRectangle({
      x: margin,
      y: y - 55,
      width: width - margin * 2,
      height: 55,
      color: this.lightBg,
      borderColor: this.borderColor,
      borderWidth: 1,
    });

    const formattedDate = data.eventDate
      ? new Date(data.eventDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'N/A';

    page1.drawText(`Client Name: ${data.clientName}`, {
      x: margin + 10,
      y: y - 18,
      size: 9,
      font: helveticaBold,
      color: this.darkText,
    });
    page1.drawText(`Date of Event: ${formattedDate}`, {
      x: margin + 310,
      y: y - 18,
      size: 9,
      font: helveticaBold,
      color: this.darkText,
    });

    page1.drawText(`Address: ${data.clientAddress}${data.clientCityStateZip ? `, ${data.clientCityStateZip}` : ''}`, {
      x: margin + 10,
      y: y - 34,
      size: 8.5,
      font: helvetica,
      color: this.darkText,
    });
    page1.drawText(`Phone: ${data.clientPhone || 'N/A'}`, {
      x: margin + 310,
      y: y - 34,
      size: 8.5,
      font: helvetica,
      color: this.darkText,
    });

    page1.drawText(`Email: ${data.clientEmail}`, {
      x: margin + 10,
      y: y - 48,
      size: 8.5,
      font: helvetica,
      color: this.darkText,
    });
    page1.drawText(`Contract ID: ${data.token.substring(0, 10).toUpperCase()}`, {
      x: margin + 310,
      y: y - 48,
      size: 8.5,
      font: helveticaBold,
      color: this.primary,
    });

    y -= 65;

    // Reglas de Seguridad (1 - 15)
    page1.drawText('SAFETY RULES & RESPONSIBILITIES FOR INFLATABLES', {
      x: margin,
      y,
      size: 10,
      font: helveticaBold,
      color: this.primary,
    });
    y -= 14;

    const safetyRules = [
      '1) No food, drink or chewing gum on or around the Inflatable. This avoids choking risk and keeps unit clean.',
      '2) Shoes, glasses, jewelry, and badges MUST be removed before using the inflatable to avoid injury.',
      '3) NO face paints, party poppers, colored streamers or SILLY STRING to be used on or near the Inflatable.',
      '4) Only 1 rider allowed at top of water slide at a time (2 for double lane), max 6 riders per bounce house.',
      '5) Company (Tehuacan Promotions / Kidsfun) is not responsible for striking underground utility lines.',
      '6) Climbing, hanging or sitting on inflatable walls is dangerous and strictly prohibited.',
      '7) A responsible Adult must supervise the inflatable at all times.',
      '8) Do not overcrowd the Inflatable; limit numbers according to age and size of children.',
      '9) Ensure Children are not pushing, colliding, fighting or behaving in a manner likely to cause distress.',
      '10) No pets, toys or sharp instruments on the inflatable at any time.',
      '11) Do not allow anyone to bounce on the front safety step as this is dangerous.',
      '12) Do not allow anyone to be on the equipment during inflation or deflation.',
      '13) Ensure Children are not attempting somersaults and pockets are completely empty.',
      '14) If blower stops, ensure users get off calmly. Check fuses and blower tube before contacting support.',
      '15) MOST IMPORTANT RULE: DO NOT let children play on the inflatable without Adult supervision.',
    ];

    for (const rule of safetyRules) {
      page1.drawText(rule, {
        x: margin,
        y,
        size: 7.5,
        font: helvetica,
        color: this.darkText,
      });
      y -= 10;
    }

    y -= 5;

    // Disclaimer Legal (1 - 9)
    page1.drawText('LIABILITY DISCLAIMER & TERMS', {
      x: margin,
      y,
      size: 10,
      font: helveticaBold,
      color: this.primary,
    });
    y -= 14;

    const liabilityRules = [
      '1) Equipment received in good condition and will be returned in same condition (ordinary wear excepted).',
      '2) Customer agrees to company right to enter premises at any time to repossess said equipment.',
      '3) Customer agrees to reimburse company for attorney fees and costs to enforce contract collection.',
      '4) Customer agrees not to loan, sublet or relocate equipment without prior written approval.',
      '5) Customer agrees to pay full replacement cost, including labor, for all damages to equipment.',
      '6) If equipment is lost, stolen, or damaged beyond repair, renter agrees to pay up to $3,000.00 USD.',
      '7) Customer agrees to ensure all users and guardians read and understand all safety rules.',
      '8) THERE ARE NO WARRANTIES OF MERCHANTABILITY OR FITNESS EXPRESSED OR IMPLIED.',
      '9) Lessee holds company harmless from any claims, suits, damages or liabilities from equipment use.',
    ];

    for (const rule of liabilityRules) {
      page1.drawText(rule, {
        x: margin,
        y,
        size: 7.2,
        font: helvetica,
        color: this.darkText,
      });
      y -= 9.5;
    }

    y -= 10;

    // Bloque de Firma Página 1
    page1.drawRectangle({
      x: margin,
      y: y - 80,
      width: width - margin * 2,
      height: 80,
      color: this.lightBg,
      borderColor: this.borderColor,
      borderWidth: 1,
    });

    page1.drawText('ELECTRONIC SIGNATURE & ACKNOWLEDGMENT OF RULES', {
      x: margin + 10,
      y: y - 16,
      size: 9,
      font: helveticaBold,
      color: this.primary,
    });

    if (data.signatureImage) {
      try {
        const base64Data = data.signatureImage.replace(/^data:image\/\w+;base64,/, '');
        const sigBuffer = Buffer.from(base64Data, 'base64');
        const sigImage = await doc.embedPng(sigBuffer);
        page1.drawImage(sigImage, {
          x: margin + 15,
          y: y - 72,
          width: 140,
          height: 48,
        });
      } catch (e) {
        this.logger.error('Error incrustando firma en PDF:', e);
      }
    }

    page1.drawText(`Signed By: ${data.clientName}`, {
      x: margin + 180,
      y: y - 35,
      size: 8.5,
      font: helveticaBold,
      color: this.darkText,
    });

    const signedDateStr = data.signedAt
      ? new Date(data.signedAt).toLocaleString('en-US')
      : 'PENDING';

    page1.drawText(`Date & Time: ${signedDateStr}`, {
      x: margin + 180,
      y: y - 50,
      size: 8.5,
      font: helvetica,
      color: this.darkText,
    });

    page1.drawText(`Digital Audit: IP ${data.signerIp || 'Recorded'} | Token: ${data.token.substring(0, 12)}`, {
      x: margin + 180,
      y: y - 65,
      size: 7.5,
      font: helvetica,
      color: this.grayText,
    });

    // ==========================================
    // PÁGINA 2: CHECKLIST & DETALLES DEL EQUIPO
    // ==========================================
    const page2 = doc.addPage([612, 792]);
    let y2 = height - margin;

    page2.drawText('RENTAL DETAILS & SAFETY CHECKLIST', {
      x: margin,
      y: y2,
      size: 14,
      font: helveticaBold,
      color: this.primary,
    });
    y2 -= 25;

    // Resumen de Operación y Pagos
    page2.drawRectangle({
      x: margin,
      y: y2 - 95,
      width: width - margin * 2,
      height: 95,
      color: this.lightBg,
      borderColor: this.borderColor,
      borderWidth: 1,
    });

    page2.drawText(`Equipment Reserved: ${data.equipment}`, {
      x: margin + 15,
      y: y2 - 20,
      size: 10,
      font: helveticaBold,
      color: this.darkText,
    });

    page2.drawText(`Surface Type: ${data.groundType || 'Grass / General'}`, {
      x: margin + 15,
      y: y2 - 38,
      size: 9,
      font: helvetica,
      color: this.darkText,
    });

    page2.drawText(`Schedule: ${data.startTime || 'Standard'} to ${data.endTime || 'Standard'}`, {
      x: margin + 280,
      y: y2 - 38,
      size: 9,
      font: helvetica,
      color: this.darkText,
    });

    const priceVal = data.price ? Number(data.price) : 0;
    const depositVal = data.deposit ? Number(data.deposit) : 0;
    const balanceDueVal = Math.max(0, priceVal - depositVal);

    const priceText = data.price ? `$${priceVal.toFixed(2)}` : 'Quoted';
    const depositText = data.deposit && depositVal > 0 ? `$${depositVal.toFixed(2)}` : '$0.00 (No Deposit)';
    const balanceText = data.price ? `$${balanceDueVal.toFixed(2)}` : 'N/A';

    page2.drawText(`Agreed Price: ${priceText}`, {
      x: margin + 15,
      y: y2 - 56,
      size: 9,
      font: helveticaBold,
      color: this.primary,
    });

    page2.drawText(`Deposit Paid: ${depositText}`, {
      x: margin + 200,
      y: y2 - 56,
      size: 9,
      font: helveticaBold,
      color: this.primary,
    });

    page2.drawText(`Balance Due at Delivery: ${balanceText}`, {
      x: margin + 350,
      y: y2 - 56,
      size: 9,
      font: helveticaBold,
      color: this.brandYellow,
    });

    if (data.notes) {
      page2.drawText(`Notes: ${data.notes}`, {
        x: margin + 15,
        y: y2 - 76,
        size: 8.5,
        font: helvetica,
        color: this.grayText,
      });
    }

    y2 -= 115;

    // Safety / How to Checklist
    page2.drawText('SAFETY / HOW TO CHECKLIST (COMPLETED BY RENTER)', {
      x: margin,
      y: y2,
      size: 11,
      font: helveticaBold,
      color: this.primary,
    });
    y2 -= 20;

    const checklistItems = [
      'I have been shown how inflatable is secured safely.',
      'I have been shown how to turn on/off blower.',
      'In high winds or storms, I will remove all participants and unplug motor.',
      'No horseplay, flips, wrestling or unsafe activities permitted.',
      'No shoes, sharp objects, food, drinks, gum, glasses or jewelry in unit.',
      'Adult (18+) operator will supervise the unit at all times.',
      'Children of same size/age group only on unit at any given time (no adults).',
      'I agree to remove any person violating posted operation rules.',
      'I have received instructions and agree to follow all safety rules.',
    ];

    for (let i = 0; i < checklistItems.length; i++) {
      const item = checklistItems[i];
      const isChecked = Boolean(data.safetyChecklist?.[`check_${i}`] ?? true);

      page2.drawText(`[ ${isChecked ? 'X' : ' '} ] ${item}`, {
        x: margin + 10,
        y: y2,
        size: 9,
        font: helvetica,
        color: this.darkText,
      });
      y2 -= 18;
    }

    y2 -= 30;

    // Footer de Validez
    page2.drawText('Official Copy — Kidsfun y Fiestas Infantiles', {
      x: margin,
      y: y2,
      size: 9,
      font: helveticaBold,
      color: this.primary,
    });

    page2.drawText('This document forms a binding agreement under ESIGN Act & UETA digital signature regulations.', {
      x: margin,
      y: y2 - 14,
      size: 8,
      font: helvetica,
      color: this.grayText,
    });

    const pdfBytes = await doc.save();
    return Buffer.from(pdfBytes);
  }
}
