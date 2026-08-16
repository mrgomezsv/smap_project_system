import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { QrService } from './qr.service';

export const DEFAULT_WAIVER_TEXT = `REGLAS DE SEGURIDAD Y RESPONSABILIDADES PARA INFLABLES

Es responsabilidad de la persona u organización que alquila este equipo inflable garantizar que se tomen todas las precauciones posibles para evitar lesiones a personas o daños al inflable. Asegúrese de cumplir con las siguientes instrucciones de seguridad:

1) No consumir alimentos, bebidas o chicles dentro ni cerca del Inflable. Esto evita riesgos de asfixia y mantiene limpia la unidad. (Si el inflable se recoge sucio, el arrendatario incurrirá en una tarifa de limpieza).
2) Calzado, anteojos, joyas y placas/insignias DEBEN retirarse antes de usar el inflable para evitar lesiones a personas y daños al equipo.
3) NO utilizar pintura facial, confeti, serpentinas ni serpentinas en aerosol (Silly String) cerca del inflable (estos productos causan daños irreparables al inflable).
4) Solo 1 persona a la vez en la parte superior del resbaladero acuático (2 para deslicetes de doble carril), máximo 6 usuarios por brincolín o unidad combo.
5) La empresa (Tehuacan Promotions y Kidsfun y Fiestas Infantiles) no se hace responsable por daños a líneas/servicios subterráneos (eléctricos, plomería, riego, etc.). Es responsabilidad del cliente indicar dónde instalar el inflable y tener marcadas las líneas subterráneas previamente.
6) Escalada, colgarse o sentarse en las paredes del inflable es peligroso y está estrictamente prohibido.
7) Un Adulto responsable debe supervisar el inflable en todo momento.
8) Asegúrese de no sobrecargar el inflable; limite el número de usuarios según la edad y tamaño de los niños. Evite que niños grandes y pequeños jueguen al mismo tiempo.
9) Asegúrese de que los niños no se empujen, colisionen, peleen ni actúen de manera que pueda lesionar o causar malestar a otros.
10) No ingresar mascotas, juguetes ni objetos punzantes al inflable en ningún momento.
11) No permitir que nadie salte en el escalón de seguridad frontal, ya que es peligroso.
12) No permitir que nadie esté sobre el equipo durante el proceso de inflado o desinflado (es DANGEROUS).
13) Asegúrese de que los niños no intenten hacer piruetas/volteretas, que vistan adecuadamente y que sus bolsillos estén completamente vacíos.
14) En caso de que el soplador deje de funcionar, asegúrese de que todos los usuarios bajen de inmediato y con calma. Verifique los fusibles y asegúrese de que el tubo de inflado no se haya soltado. Si se sobrecalienta o pierde fuerza, apáguelo en la toma de corriente, espere 1 o 2 minutos y vuelva a encenderlo. Si no reinicia, infórmenos de inmediato.
15) LA REGLA MÁS IMPORTANTE: NO permita que los niños jueguen en el inflable sin supervisión de un Adulto.

EXENCIÓN DE RESPONSABILIDAD CIVIL Y TÉRMINOS

1) El equipo arrendado se recibe en buenas condiciones y será devuelto en el mismo estado (exceptuando el desgaste ordinario por uso).
2) El cliente acuerda el derecho de la empresa a ingresar a sus instalaciones en cualquier momento para reinterpretar o reposesionar dicho equipo.
3) El cliente acuerda reembolsar a (Tehuacan Promotions y Kidsfun y Fiestas Infantiles) por honorarios de abogados (no menos del 50% de las sumas adeudadas), costos judiciales y gastos incurridos para hacer cumplir este contrato.
4) El cliente se compromete a no prestar, subarrendar ni trasladar el equipo a otra ubicación sin autorización previa.
5) El cliente se compromete a pagar en su totalidad el costo de reemplazo, incluida la mano de obra, por todos los daños causados al equipo de alquiler.
6) Si el equipo inflable se pierde, es robado o se daña sin posibilidad de reparación, el arrendatario acepta pagar hasta $3,000.00 USD (Tres mil dólares 00/100).
7) El cliente se compromete a garantizar que todos los usuarios (y tutores) lean y comprendan todas las reglas.
8) NO EXISTEN GARANTÍAS DE COMERCIABILIDAD NI IDONEIDAD EXPRESAS NI IMPLÍCITAS. La persona u organización que alquila este equipo a (Tehuacan Promotions y Kidsfun y Fiestas Infantiles) responderá por cualquier daño o lesión ocurrida por cualquier motivo.
9) El arrendatario reconoce que el uso del equipo conlleva riesgos conocidos y desconocidos (lesiones físicas, caídas, parálisis o fallecimiento), exonerando e indemnizando totalmente a (Tehuacan Promotions y Kidsfun y Fiestas Infantiles) de cualquier demanda o reclamo derivado de la posesión, uso o devolución del equipo.`;

export const DEFAULT_WAIVER_TEXT_EN = `SAFETY RULES & RESPONSIBILITIES FOR INFLATABLES

It is the responsibility of the person/s or organization hiring this inflatable equipment to ensure that all possible precautions are taken to avoid injury to people or damage to the inflatable. Please ensure the following safety instructions are followed:

1) No food, drink or chewing gum on or around the Inflatable. This will avoid a choking risk and keep the unit clean. (Please note if the Inflatable is collected in a dirty condition then the person hiring it will incur a cleaning charge).
2) Shoes, glasses, jewelry, and badges MUST be removed before using the inflatable to avoid injury to peoples using the equipment and harm to the Inflatable.
3) NO face paints, party poppers, colored streamers or SILLY STRING to be used either on or near the Inflatable. (Please note these products will cause damage to the Inflatable that cannot be repaired).
4) Only 1 rider allowed at the top of water slide at a time, or 2 riders for double lane slides, 6 riders per bounce house or combo unit.
5) (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) not responsible for striking or damaging any underground utility lines/devices (included but not limited to: electrical, plumbing, sprinkler, etc.). It is lessee’s responsibility to tell Rental Company where inflatable is to be set up and have any underground utility lines marked prior too.
6) Climbing, hanging or sitting on walls is dangerous and must not be allowed.
7) A responsible Adult must supervise the inflatable at all times.
8) Always ensure that the Inflatable is not overcrowded, and limit numbers according to the age and size of children using it. Try to avoid large and small children from using it at the same time.
9) Ensure Children are not pushing, colliding, fighting or behaving in a manner likely to injure or cause distress to others.
10) No pets, toys or sharp instruments on the inflatable at any time.
11) Do not allow anyone to bounce on the front safety step as this is dangerous.
12) Do not allow anyone to be on the inflatable equipment during inflation or deflation as this is DANGEROUS.
13) Please ensure that Children are not attempting somersaults and are clothed appropriately and that nothing can fall out of their pockets.
14) In the event that the blower stops working, please ensure all users get off the inflatable immediately and calmly. Check the fuses and make sure the blower tube or deflation tube has not come undone or something has not blown onto and is obstructing the blower. In the event that it overheats, or loses power, switch the blower off at the mains, then switch it back on again 1 or 2 minutes later, and it should restart. If it does not, inform us immediately.
15) THE MOST IMPORTANT RULE: DO NOT let children play on the inflatable without Adult supervision. Adult supervision is necessary to enforce these rules for safe operation of the Inflatable.

LIABILITY DISCLAIMER & ACCEPTANCE

1) This rental equipment has been received in good condition and will be returned in the same condition (ordinary wear and accepted).
2) Customer agrees to company right to enter premises of customer at any time to repossess said equipment.
3) Customer agrees to reimburse (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) for all attorney fees, an amount not less than 50% of all sums due, court cost and expenses incurred by Rental Company to enforce collection or to preserve or enforce rights under this contract.
4) Customer agrees not to loan, sublet or otherwise depose of equipment or use it at any other location.
5) Customer agrees to pay in full the replacement cost, including labor, for all damages to rental equipment.
6) If the inflatable equipment is lost, stolen, or damaged beyond repair the renter agrees to pay up to $3000.00 (Three thousand dollars and 0 cents).
7) Customer agrees to ensure that all users (and users’ guardians) of the rental go over and read all rules.
8) THERE ARE NO WARRANTIES OF MERCHANTABILITY OR FITNESS EITHER EXPRESSED OR IMPLIED. The person/s or organization renting this Equipment from (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) will be held responsible and liable for any and all damage or injury occurring for any reason whatsoever. I have read the above agreement and fully understand and accept the conditions as above. I am aware that while in my care I am fully responsible for the inflatable and will pay for any loss or damages that may occur.
9) Lessee understands and acknowledges that play on an amusement device entails both known and unknown risks including, but not limited to, physical injury from falling, slipping, crashing or colliding, emotional injury, paralysis, distress, damage or death to any participant. Lessee agrees to indemnify and hold (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) harmless from any and all claims, actions, suits, proceedings, costs, expenses, fees, damages and liabilities, including, but not limited to, reasonable attorney’s fees and costs, arising by reason of injury, damage, or death to persons or property, in connection with or resulting from the use of the leased equipment. This includes, but is not limited to, the manufacture, selection, delivery, possession, use, operation, or return of the equipment. Lessee hereby releases and holds harmless (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) from injuries or damages incurred as a result of the use of the leased equipment. (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) cannot, under any circumstances, be held liable for injuries as a result of inappropriate use, God, nature, or other conditions beyond its control or knowledge. Lessee also agrees to indemnify and hold harmless (Tehuacan Promotions and Kidsfun y Fiestas Infantiles) from any loss, damage, theft or destruction of the equipment during the term of the lease and any extensions thereof.`;

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
