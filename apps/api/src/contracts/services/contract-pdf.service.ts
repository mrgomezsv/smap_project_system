import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';

function sanitizePdfText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/[—–]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/[^\x00-\xFF]/g, '');
}

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
    const times = await doc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);

    const black = rgb(0, 0, 0);
    const blueLabel = rgb(0, 0, 0.49); // #00007e azul de tablas en PDF original
    const yellowBg = rgb(1, 1, 0); // #FFFF00 resaltador amarillo
    const redBg = rgb(1, 0, 0); // #FF0000 resaltador rojo
    const white = rgb(1, 1, 1);
    const gray = rgb(0.4, 0.4, 0.4);

    const margin = 54;
    const pageWidth = 612;
    const pageHeight = 817; // Altura exacta de página del PDF original
    const contentWidth = pageWidth - margin * 2; // 504pt

    const formattedDate = data.eventDate
      ? new Date(data.eventDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'N/A';

    const signedDate = data.signedAt
      ? new Date(data.signedAt).toLocaleDateString('en-US')
      : '________________________';

    // Helper para dibujar texto con fondo resaltado
    const drawHighlightedText = (
      page: any,
      text: string,
      x: number,
      y: number,
      size: number,
      font: any,
      txtColor: any,
      bgColor: any,
    ) => {
      const w = font.widthOfTextAtSize(text, size);
      page.drawRectangle({
        x,
        y: y - 2,
        width: w,
        height: size + 3,
        color: bgColor,
      });
      page.drawText(text, { x, y, size, font, color: txtColor });
      return w;
    };

    // ==========================================
    // PÁGINA 1: SAFETY RULES & TOP BLUE TABLE
    // ==========================================
    const page1 = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // 1. Tabla Superior de Datos del Cliente (Letras azules #00007e)
    const tableTopY = y;
    const rowH = 18;
    const tableH = rowH * 3;

    page1.drawRectangle({
      x: margin,
      y: tableTopY - tableH,
      width: contentWidth,
      height: tableH,
      borderColor: black,
      borderWidth: 0.8,
    });

    page1.drawLine({
      start: { x: margin, y: tableTopY - rowH },
      end: { x: margin + contentWidth, y: tableTopY - rowH },
      thickness: 0.8,
      color: black,
    });
    page1.drawLine({
      start: { x: margin, y: tableTopY - rowH * 2 },
      end: { x: margin + contentWidth, y: tableTopY - rowH * 2 },
      thickness: 0.8,
      color: black,
    });

    const col2X = margin + 105;
    const col3X = col2X + 162;

    page1.drawLine({
      start: { x: col2X, y: tableTopY },
      end: { x: col2X, y: tableTopY - tableH },
      thickness: 0.8,
      color: black,
    });
    page1.drawLine({
      start: { x: col3X, y: tableTopY },
      end: { x: col3X, y: tableTopY - tableH },
      thickness: 0.8,
      color: black,
    });

    // Textos Azules de Tabla
    page1.drawText('Name:', {
      x: margin + 4,
      y: tableTopY - 13,
      size: 10,
      font: times,
      color: blueLabel,
    });
    page1.drawText(sanitizePdfText(data.clientName), {
      x: col2X + 4,
      y: tableTopY - 13,
      size: 10,
      font: times,
      color: black,
    });
    page1.drawText('Date:', {
      x: col3X + 4,
      y: tableTopY - 13,
      size: 10,
      font: times,
      color: blueLabel,
    });
    page1.drawText(formattedDate, {
      x: col3X + 110,
      y: tableTopY - 13,
      size: 10,
      font: times,
      color: black,
    });

    page1.drawText('Phone Home', {
      x: margin + 4,
      y: tableTopY - 31,
      size: 10,
      font: times,
      color: blueLabel,
    });
    page1.drawText(sanitizePdfText(data.clientPhone) || '', {
      x: col2X + 4,
      y: tableTopY - 31,
      size: 10,
      font: times,
      color: black,
    });
    page1.drawText('Address:', {
      x: col3X + 4,
      y: tableTopY - 31,
      size: 10,
      font: times,
      color: blueLabel,
    });
    page1.drawText(sanitizePdfText(data.clientAddress), {
      x: col3X + 110,
      y: tableTopY - 31,
      size: 9,
      font: times,
      color: black,
    });

    page1.drawText('Phone Cell.', {
      x: margin + 4,
      y: tableTopY - 49,
      size: 10,
      font: times,
      color: blueLabel,
    });
    page1.drawText(sanitizePdfText(data.clientPhone) || '', {
      x: col2X + 4,
      y: tableTopY - 49,
      size: 10,
      font: times,
      color: black,
    });
    page1.drawText('City, State, Zip', {
      x: col3X + 4,
      y: tableTopY - 49,
      size: 10,
      font: times,
      color: blueLabel,
    });
    page1.drawText(sanitizePdfText(data.clientCityStateZip) || '', {
      x: col3X + 110,
      y: tableTopY - 49,
      size: 9,
      font: times,
      color: black,
    });

    y -= tableH + 28;

    // 2. Título Centrado: Rental Agreement and Liability Waiver (18pt Bold Underlined)
    const titleText = 'Rental Agreement and Liability Waiver';
    const titleW = timesBold.widthOfTextAtSize(titleText, 18);
    const titleX = (pageWidth - titleW) / 2;

    page1.drawText(titleText, {
      x: titleX,
      y,
      size: 18,
      font: timesBold,
      color: black,
    });
    page1.drawLine({
      start: { x: titleX, y: y - 3 },
      end: { x: titleX + titleW, y: y - 3 },
      thickness: 1.2,
      color: black,
    });

    y -= 22;

    // 3. Subtítulo Introductorio Centrado (9pt Times)
    const introText =
      'It is the responsibility of the person/s or organization hiring this inflatable equipment to ensure that all possible precautions are taken to avoid injury to people or damage to the inflatable. Please ensure the following safety instructions are followed:';
    const introLines = this.wrapText(introText, contentWidth - 10, times, 9);
    for (const line of introLines) {
      const lw = times.widthOfTextAtSize(line, 9);
      page1.drawText(line, {
        x: (pageWidth - lw) / 2,
        y,
        size: 9,
        font: times,
        color: black,
      });
      y -= 11.5;
    }

    y -= 10;

    // 4. Las 15 Reglas de Seguridad Verbatim (9pt Times)
    const safetyRules = [
      '1) No food, drink or chewing gum on or around the Inflatable. This will avoid a choking risk and keep the unit clean. (Please note if the Inflatable is collected in a dirty condition then the person hiring it will incur a cleaning charge)',
      '2) Shoes, glasses, jewelry, and badges MUST be removed before using the inflatable to avoid injury to peoples using the equipment and harm to the Inflatable.',
      '3) NO face paints, party poppers, colored streamers or SILLY STRING to be used either on or near the Inflatable.(Please note these products will cause damage to the Inflatable that cannot be repaired)',
      '4) Only 1 rider allowed at the top of water slide at a time, or 2 riders for double lane slides, 6 riders per bounce house or combo unit.',
      '5_RULE', // Regla 5 especial con resaltado amarillo
      '6) Climbing, hanging or sitting on walls is dangerous and must not be allowed.',
      '7) A responsible Adult must supervise the inflatable at all times.',
      '8) Always ensure that the Inflatable is not overcrowded, and limit numbers according to the age and size of children using it. Try to avoid large and small children from using it at the same time.',
      '9) Ensure Children are not pushing, colliding, fighting or behaving in a manner likely to injure or cause distress to others.',
      '10) No pets, toys or sharp instruments on the inflatable at any time.',
      '11) Do not allow anyone to bounce on the front safety step as this is dangerous',
      '12) Do not allow anyone to be on the inflatable equipment during inflation or deflation as this is DANGEROUS.',
      '13) Please ensure that Children are not attempting somersaults and are clothed appropriately and that nothing can fall out of their pockets.',
      '14) In the event that the blower stops working, please ensure all users get off the inflatable immediately and calmly. Check the fuses and make sure the blower tube or deflation tube has not come undone or something has not blown onto and is obstructing the blower. In the event that it overheats, or loses power, switch the blower off at the mains, then switch it back on again 1 or 2 minutes later, and it should restart. If it does not, inform us immediately.',
      '15) THE MOST IMPORTANT RULE: DO NOT let children play on the inflatable without Adult supervision. Adult supervision is necessary to enforce these rules for safe operation of the Inflatable.',
    ];

    for (const rule of safetyRules) {
      if (rule === '5_RULE') {
        page1.drawText('5) ', {
          x: margin,
          y,
          size: 9,
          font: timesBold,
          color: black,
        });
        const hlW = drawHighlightedText(
          page1,
          '(Tehuacan Promotions and Kidsfun y Fiestas Infantiles )',
          margin + 12,
          y,
          9,
          timesBold,
          black,
          yellowBg,
        );
        const restRule5 =
          ' not responsible for striking or damaging any underground utility lines/devices (included but not limited to: electrical, plumbing, sprinkler, etc.). It is lessee’s responsibility to tell Rental Company where inflatable is to be set up and have any underground utility lines marked prior too.';
        const r5Lines = this.wrapText(
          restRule5,
          contentWidth - hlW - 14,
          times,
          9,
        );
        if (r5Lines.length > 0) {
          page1.drawText(r5Lines[0], {
            x: margin + 12 + hlW + 2,
            y,
            size: 9,
            font: times,
            color: black,
          });
          y -= 11;
          for (let k = 1; k < r5Lines.length; k++) {
            page1.drawText(r5Lines[k], {
              x: margin,
              y,
              size: 9,
              font: times,
              color: black,
            });
            y -= 11;
          }
        }
        y -= 3;
        continue;
      }

      const lines = this.wrapText(rule, contentWidth, times, 9);
      for (const line of lines) {
        page1.drawText(sanitizePdfText(line), {
          x: margin,
          y,
          size: 9,
          font: times,
          color: black,
        });
        y -= 11;
      }
      y -= 3;
    }

    y -= 15;

    // 5. Línea de Firma de Lectura de Reglas
    if (data.signatureImage) {
      try {
        const base64Data = data.signatureImage.replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        const sigBuffer = Buffer.from(base64Data, 'base64');
        const sigImage = await doc.embedPng(sigBuffer);
        page1.drawImage(sigImage, {
          x: margin + 30,
          y: y - 18,
          width: 120,
          height: 35,
        });
      } catch (e) {
        // Ignorar
      }
    }

    const signedStr = data.signatureImage
      ? sanitizePdfText(data.clientName)
      : '______________________________';
    page1.drawText(`X ${signedStr} SIGN HERE AFTER READING RULES`, {
      x: margin,
      y,
      size: 11,
      font: times,
      color: black,
    });

    // ==========================================
    // PÁGINA 2: LIABILITY DISCLAIMER (Resaltados Amarillo y Rojo)
    // ==========================================
    const page2 = doc.addPage([pageWidth, pageHeight]);
    let y2 = pageHeight - margin;

    // Título Centrado y Subrayado: LIABILITY DISCLAIMER
    const disTitle = 'LIABILITY DISCLAIMER';
    const disW = timesBold.widthOfTextAtSize(disTitle, 11);
    const disX = (pageWidth - disW) / 2;

    page2.drawText(disTitle, {
      x: disX,
      y: y2,
      size: 11,
      font: timesBold,
      color: black,
    });
    page2.drawLine({
      start: { x: disX, y: y2 - 2 },
      end: { x: disX + disW, y: y2 - 2 },
      thickness: 1,
      color: black,
    });

    y2 -= 20;

    // Cláusula 1
    const c1 =
      '1) This rental equipment has been received in good condition and will be returned in the same condition (ordinary wear and accepted)';
    for (const l of this.wrapText(c1, contentWidth, times, 11)) {
      page2.drawText(l, {
        x: margin,
        y: y2,
        size: 11,
        font: times,
        color: black,
      });
      y2 -= 13.5;
    }
    y2 -= 6;

    // Cláusula 2
    const c2 =
      '2) Customer agrees to company right to enter premises of customer at any time to repossess said equipment.';
    for (const l of this.wrapText(c2, contentWidth, times, 11)) {
      page2.drawText(l, {
        x: margin,
        y: y2,
        size: 11,
        font: times,
        color: black,
      });
      y2 -= 13.5;
    }
    y2 -= 6;

    // Cláusula 3 (Con resaltado amarillo en el nombre de empresa)
    page2.drawText('3) Customer agrees to reimburse ', {
      x: margin,
      y: y2,
      size: 11,
      font: times,
      color: black,
    });
    const c3HlW = drawHighlightedText(
      page2,
      '(TehuacanPromotions and Kidsfun y Fiestas Infantiles)',
      margin + 155,
      y2,
      11,
      times,
      black,
      yellowBg,
    );
    const c3Rest =
      ' for all attorney fees, an amount not less than 50% of all sums due, court cost and expenses incurred by Rental Company to enforce collection or to preserve or enforce rights under this contract.';
    const c3Lines = this.wrapText(c3Rest, contentWidth, times, 11);
    y2 -= 13.5;
    for (const l of c3Lines) {
      page2.drawText(l, {
        x: margin,
        y: y2,
        size: 11,
        font: times,
        color: black,
      });
      y2 -= 13.5;
    }
    y2 -= 6;

    // Cláusulas 4 a 7
    const c4_7 = [
      '4) Customer agrees not to loan, sublet or otherwise depose of equipment or use it at any other location.',
      '5) Customer agrees to pay in full the replacement cost, including labor, for all damages to rental equipment.',
      '6) If the inflatable equipment is lost, stolen, or damaged beyond repair the renter agrees to pay up to $3000.00(Three thousand dollars and 0 cents)',
      '7) Customer agrees to ensure that all users (and users’ guardians) of the rental go over and read all rules.',
    ];
    for (const rule of c4_7) {
      for (const l of this.wrapText(rule, contentWidth, times, 11)) {
        page2.drawText(l, {
          x: margin,
          y: y2,
          size: 11,
          font: times,
          color: black,
        });
        y2 -= 13.5;
      }
      y2 -= 6;
    }

    // Cláusula 8 (Bold con resalta amarillo)
    page2.drawText(
      '8) THERE ARE NO WARRANTIES OF MERCHANTABILITY OR FITNESS EITHER EXPRESSED OR IMPLIED. The person/s or organization renting this Equipment from ',
      { x: margin, y: y2, size: 10, font: timesBold, color: black },
    );
    y2 -= 13.5;
    drawHighlightedText(
      page2,
      '(TehuacanPromotions and Kidsfun y Fiestas Infantiles)',
      margin,
      y2,
      10,
      timesBold,
      black,
      yellowBg,
    );
    const c8Rest =
      ' will be held responsible and liable for any and all damage or injury occurring for any reason whatsoever. I have read the above agreement and fully understand and accept the conditions as above. I am aware that while in my care I am fully responsible for the inflatable and will pay for any loss or damages that may occur.';
    for (const l of this.wrapText(c8Rest, contentWidth, timesBold, 10)) {
      page2.drawText(l, {
        x: margin,
        y: y2,
        size: 10,
        font: timesBold,
        color: black,
      });
      y2 -= 13.5;
    }
    y2 -= 8;

    // Cláusula 9 (Con resaltados amarillo y rojo exactos)
    const c9Lines = [
      '9) Lessee understands and acknowledges that play on an amusement device entails both known and unknown risks including, but not limited to, physical injury from falling, slipping, crashing or colliding, emotional injury, paralysis, distress, damage or death to any participant. Lessee agrees to indemnify and hold ',
      'harmless from any and all claims, actions, suits, proceedings, costs, expenses, fees, damages and liabilities, including, but not limited to, reasonable attorney’s fees and costs, arising by reason of injury, damage, or death to persons or property, in connection with or resulting from the use of the leased equipment. This includes, but is not limited to, the manufacture, selection, delivery, possession, use, operation, or return of the equipment. Lessee hereby releases and holds harmless ',
      ' from injuries or damages incurred as a result of the use of the leased equipment. ',
      ' cannot, under any circumstances, be held liable for injuries as a result of inappropriate use, God, nature, or other conditions beyond its control or knowledge. Lessee also agrees to indemnify and hold harmless ',
      ' from any loss, damage, theft or destruction of the equipment during the term of the lease and any extensions thereof.',
    ];

    for (const l of this.wrapText(c9Lines[0], contentWidth, timesBold, 9.5)) {
      page2.drawText(l, {
        x: margin,
        y: y2,
        size: 9.5,
        font: timesBold,
        color: black,
      });
      y2 -= 12;
    }

    // Resaltado ROJO "hold" y AMARILLO "(TehuacanPromotions...)"
    let curX = margin;
    curX += drawHighlightedText(
      page2,
      'hold ',
      curX,
      y2,
      9.5,
      timesBold,
      white,
      redBg,
    );
    curX += drawHighlightedText(
      page2,
      '(TehuacanPromotions and Kidsfun y Fiestas Infantiles) ',
      curX,
      y2,
      9.5,
      timesBold,
      black,
      yellowBg,
    );
    drawHighlightedText(
      page2,
      'harmless',
      curX,
      y2,
      9.5,
      timesBold,
      white,
      redBg,
    );
    y2 -= 12;

    for (const l of this.wrapText(c9Lines[1], contentWidth, timesBold, 9.5)) {
      page2.drawText(l, {
        x: margin,
        y: y2,
        size: 9.5,
        font: timesBold,
        color: black,
      });
      y2 -= 12;
    }
    drawHighlightedText(
      page2,
      '(TehuacanPromotions and Kidsfun y Fiestas Infantiles)',
      margin,
      y2,
      9.5,
      timesBold,
      black,
      yellowBg,
    );
    y2 -= 12;

    for (const l of this.wrapText(c9Lines[3], contentWidth, timesBold, 9.5)) {
      page2.drawText(l, {
        x: margin,
        y: y2,
        size: 9.5,
        font: timesBold,
        color: black,
      });
      y2 -= 12;
    }
    drawHighlightedText(
      page2,
      '(TehuacanPromotions and Kidsfun y Fiestas Infantiles)',
      margin,
      y2,
      9.5,
      timesBold,
      black,
      yellowBg,
    );
    y2 -= 14;

    // Sección de Iniciales y Firma con Resaltado Amarillo en Initial
    drawHighlightedText(
      page2,
      '______ Initial',
      margin,
      y2,
      11,
      timesBold,
      black,
      yellowBg,
    );
    y2 -= 25;

    if (data.signatureImage) {
      try {
        const base64Data = data.signatureImage.replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        const sigBuffer = Buffer.from(base64Data, 'base64');
        const sigImage = await doc.embedPng(sigBuffer);
        page2.drawImage(sigImage, {
          x: margin + 140,
          y: y2 - 15,
          width: 130,
          height: 40,
        });
      } catch (e) {
        // Ignorar
      }
    }

    page2.drawText(
      `Participant’s Signature X ___________________________________         Date X ${signedDate}`,
      {
        x: margin,
        y: y2,
        size: 11,
        font: timesBold,
        color: black,
      },
    );

    y2 -= 25;

    page2.drawText(
      `Participant’s Printed Name X ${sanitizePdfText(data.clientName)}`,
      {
        x: margin,
        y: y2,
        size: 11,
        font: timesBold,
        color: black,
      },
    );

    // ==========================================
    // PÁGINA 3: CHECKLIST ITEM 1 A 8 (Letras Azules en Tabla)
    // ==========================================
    const page3 = doc.addPage([pageWidth, pageHeight]);
    let y3 = pageHeight - margin;

    // Tabla Superior del Checklist (Textos Azules)
    const chkTableY = y3;
    const chkRowH = 20;
    const chkTableH = chkRowH * 5;

    page3.drawRectangle({
      x: margin,
      y: chkTableY - chkTableH,
      width: contentWidth,
      height: chkTableH,
      borderColor: black,
      borderWidth: 0.8,
    });

    for (let r = 1; r < 5; r++) {
      page3.drawLine({
        start: { x: margin, y: chkTableY - r * chkRowH },
        end: { x: margin + contentWidth, y: chkTableY - r * chkRowH },
        thickness: 0.8,
        color: black,
      });
    }

    const cCol2 = margin + 90;
    const cCol3 = margin + 270;

    page3.drawLine({
      start: { x: cCol2, y: chkTableY },
      end: { x: cCol2, y: chkTableY - chkTableH },
      thickness: 0.8,
      color: black,
    });
    page3.drawLine({
      start: { x: cCol3, y: chkTableY },
      end: { x: cCol3, y: chkTableY - chkTableH },
      thickness: 0.8,
      color: black,
    });

    // Textos Azules de la Tabla de Checklist
    page3.drawText('Name:', {
      x: margin + 4,
      y: chkTableY - 14,
      size: 9.5,
      font: times,
      color: blueLabel,
    });
    page3.drawText(sanitizePdfText(data.clientName), {
      x: cCol2 + 4,
      y: chkTableY - 14,
      size: 9.5,
      font: times,
      color: black,
    });
    page3.drawText('Driver’s License #:', {
      x: cCol3 + 4,
      y: chkTableY - 14,
      size: 9.5,
      font: times,
      color: blueLabel,
    });
    page3.drawText(sanitizePdfText(data.driverLicense) || '', {
      x: cCol3 + 105,
      y: chkTableY - 14,
      size: 9.5,
      font: times,
      color: black,
    });

    page3.drawText('Start Time:', {
      x: margin + 4,
      y: chkTableY - 34,
      size: 9.5,
      font: times,
      color: blueLabel,
    });
    page3.drawText(sanitizePdfText(data.startTime) || '', {
      x: cCol2 + 4,
      y: chkTableY - 34,
      size: 9.5,
      font: times,
      color: black,
    });
    page3.drawText('End Time:', {
      x: cCol3 + 4,
      y: chkTableY - 34,
      size: 9.5,
      font: times,
      color: blueLabel,
    });
    page3.drawText(sanitizePdfText(data.endTime) || '', {
      x: cCol3 + 105,
      y: chkTableY - 34,
      size: 9.5,
      font: times,
      color: black,
    });

    page3.drawText('Equipment', {
      x: margin + 4,
      y: chkTableY - 54,
      size: 9.5,
      font: times,
      color: blueLabel,
    });
    page3.drawText(
      'O Bounce House O Wet –Dry Slide O Concession Machines O Other',
      {
        x: cCol2 + 4,
        y: chkTableY - 54,
        size: 8.5,
        font: times,
        color: blueLabel,
      },
    );
    page3.drawText('Ground Type:', {
      x: cCol3 + 4,
      y: chkTableY - 54,
      size: 9.5,
      font: times,
      color: blueLabel,
    });
    page3.drawText('O Grass O Concrete O Dirt O Other', {
      x: cCol3 + 80,
      y: chkTableY - 54,
      size: 8.5,
      font: times,
      color: blueLabel,
    });

    page3.drawText('Make:', {
      x: margin + 4,
      y: chkTableY - 74,
      size: 9.5,
      font: times,
      color: blueLabel,
    });
    page3.drawText('Model:               Plate#', {
      x: cCol2 + 4,
      y: chkTableY - 74,
      size: 9,
      font: times,
      color: blueLabel,
    });
    page3.drawText('CC#: TYPE: EXP:', {
      x: cCol3 + 4,
      y: chkTableY - 74,
      size: 9,
      font: times,
      color: blueLabel,
    });

    page3.drawText('Signature:', {
      x: margin + 4,
      y: chkTableY - 94,
      size: 9.5,
      font: times,
      color: blueLabel,
    });
    page3.drawText(sanitizePdfText(data.clientName) + ' (Digital Signed)', {
      x: cCol2 + 4,
      y: chkTableY - 94,
      size: 9,
      font: times,
      color: black,
    });
    page3.drawText('Date:', {
      x: cCol3 + 4,
      y: chkTableY - 94,
      size: 9.5,
      font: times,
      color: blueLabel,
    });
    page3.drawText(signedDate, {
      x: cCol3 + 80,
      y: chkTableY - 94,
      size: 9,
      font: times,
      color: black,
    });

    y3 -= chkTableH + 30;

    // Título Centrado Grande: Safety / How to Checklist (26pt Times Bold)
    const chkTitle = 'Safety / How to Checklist';
    const chkTW = timesBold.widthOfTextAtSize(chkTitle, 26);
    page3.drawText(chkTitle, {
      x: (pageWidth - chkTW) / 2,
      y: y3,
      size: 26,
      font: timesBold,
      color: black,
    });

    y3 -= 35;

    // Puntos 1 a 4
    const chkItemsP3 = [
      '• I have been shown how inflatable is secured.    ______',
      '• I have been shown how to turn on/off blower.  ______',
      '• In the event of high winds or storms, I have been instructed to get all participants off the unit and unplug the motor and extension cord from the power outlet.  _____',
      '• I have been instructed to not allow any horseplay, flips, wrestling or any other unsafe activities both in and around inflatable.   _____',
    ];

    for (const item of chkItemsP3) {
      const lines = this.wrapText(item, contentWidth, times, 14);
      for (const l of lines) {
        const lw = times.widthOfTextAtSize(l, 14);
        page3.drawText(l, {
          x: (pageWidth - lw) / 2,
          y: y3,
          size: 14,
          font: times,
          color: black,
        });
        y3 -= 18;
      }
      y3 -= 6;
    }

    // Sub-lista
    const advisedTitle = 'I have been advised of the following…';
    const advW = timesBold.widthOfTextAtSize(advisedTitle, 14);
    page3.drawText(advisedTitle, {
      x: (pageWidth - advW) / 2,
      y: y3,
      size: 14,
      font: timesBold,
      color: black,
    });
    y3 -= 18;

    const subAdvised = [
      '1. No shoes or sharp objects in or around the inflatable unit(s);',
      '2. No food, drinks or gum;',
      '3. No eyeglasses or jewelry.',
    ];
    for (const sub of subAdvised) {
      const subW = times.widthOfTextAtSize(sub, 14);
      page3.drawText(sub, {
        x: (pageWidth - subW) / 2,
        y: y3,
        size: 14,
        font: times,
        color: black,
      });
      y3 -= 18;
    }
    y3 -= 8;

    // Puntos 5 a 7
    const chkEndP3 = [
      '• I understand that adult (18 years old & up) operators must be provided to watch the games at all times.   _____',
      '• I have been advised that children of the same size or age group only may use the unit(s) at any given time, no adults.  _____',
      '• I agree to remove any person from the inflatable who is violating posted rules of operation.  _____',
    ];

    for (const item of chkEndP3) {
      const lines = this.wrapText(item, contentWidth, times, 14);
      for (const l of lines) {
        const lw = times.widthOfTextAtSize(l, 14);
        page3.drawText(l, {
          x: (pageWidth - lw) / 2,
          y: y3,
          size: 14,
          font: times,
          color: black,
        });
        y3 -= 18;
      }
      y3 -= 6;
    }

    // ==========================================
    // PÁGINA 4: CHECKLIST ITEM 8 (Tal cual PDF Original)
    // ==========================================
    const page4 = doc.addPage([pageWidth, pageHeight]);
    let y4 = pageHeight - margin - 20;

    const lastItem =
      '• I have received written instruction on the safe operation of inflatable and agree to follow all safety rules. ____';
    const lastLines = this.wrapText(lastItem, contentWidth, times, 14);
    for (const l of lastLines) {
      const lw = times.widthOfTextAtSize(l, 14);
      page4.drawText(l, {
        x: (pageWidth - lw) / 2,
        y: y4,
        size: 14,
        font: times,
        color: black,
      });
      y4 -= 18;
    }

    // Audit Footer
    page4.drawText(
      `Audit IP: ${data.signerIp || 'Recorded'} | Token: ${data.token} | Digital Signature Verified`,
      {
        x: margin,
        y: margin,
        size: 8,
        font: times,
        color: gray,
      },
    );

    const pdfBytes = await doc.save();
    return Buffer.from(pdfBytes);
  }

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
