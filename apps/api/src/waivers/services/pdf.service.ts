import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { QrService } from './qr.service';

export const DEFAULT_WAIVER_TEXT = `August 04, 2024
POLÍTICA DE PRIVACIDAD

El presente Política de Privacidad establece los términos en que Kidsfun y Fiestas Infantiles usa y protege la información que es proporcionada por sus usuarios al momento de utilizar su sitio web. Esta compañía está comprometida con la seguridad de los datos de sus usuarios. Cuando le pedimos llenar los campos de información personal con la cual usted pueda ser identificado, lo hacemos asegurando que sólo se empleará de acuerdo con los términos de este documento. Sin embargo esta Política de Privacidad puede cambiar con el tiempo o ser actualizada por lo que le recomendamos y enfatizamos revisar continuamente esta página para asegurarse que está de acuerdo con dichos cambios.

Información que es recogida

Nuestro sitio web podrá recoger información personal por ejemplo: Nombre,  información de contacto como  su dirección de correo electrónica e información demográfica. Así mismo cuando sea necesario podrá ser requerida información específica para procesar algún pedido o realizar una entrega o facturación.

Uso de la información recogida

Nuestro sitio web emplea la información con el fin de proporcionar el mejor servicio posible, particularmente para mantener un registro de usuarios, de pedidos en caso que aplique, y mejorar nuestros productos y servicios.  Es posible que sean enviados correos electrónicos periódicamente a través de nuestro sitio con ofertas especiales, nuevos productos y otra información publicitaria que consideremos relevante para usted o que pueda brindarle algún beneficio, estos correos electrónicos serán enviados a la dirección que usted proporcione y podrán ser cancelados en cualquier momento.

Kidsfun y Fiestas Infantiles está altamente comprometido para cumplir con el compromiso de mantener su información segura. Usamos los sistemas más avanzados y los actualizamos constantemente para asegurarnos que no exista ningún acceso no autorizado.

Cookies

Una cookie se refiere a un fichero que es enviado con la finalidad de solicitar permiso para almacenarse en su ordenador, al aceptar dicho fichero se crea y la cookie sirve entonces para tener información respecto al tráfico web, y también facilita las futuras visitas a una web recurrente. Otra función que tienen las cookies es que con ellas las web pueden reconocerte individualmente y por tanto brindarte el mejor servicio personalizado de su web.

Nuestro sitio web emplea las cookies para poder identificar las páginas que son visitadas y su frecuencia. Esta información es empleada únicamente para análisis estadístico y después la información se elimina de forma permanente. Usted puede eliminar las cookies en cualquier momento desde su ordenador. Sin embargo las cookies ayudan a proporcionar un mejor servicio de los sitios web, no dan acceso a información de su ordenador ni de usted, a menos de que usted así lo quiera y la proporcione directamente noticias . Usted puede aceptar o negar el uso de cookies, sin embargo la mayoría de los navegadores aceptan cookies automáticamente pues sirve para tener un mejor servicio web. También usted puede cambiar la configuración de su ordenador para rechazar las cookies. Si se declinan es posible que no pueda utilizar algunos de nuestros servicios. 

Enlaces a Terceros

Este sitio web pudiera contener enlaces a otros sitios que pudieran ser de su interés. Una vez que usted de clic en estos enlaces y abandone nuestra página, ya no tenemos control sobre al sitio al que es redirigido y por lo tanto no somos responsables de los términos o privacidad ni de la protección de sus datos en esos otros sitios terceros. Dichos sitios están sujetos a sus propias políticas de privacidad por lo cual es recomendable que los consulte para confirmar que usted está de acuerdo con estas.  

Control de su información personal

En cualquier momento usted puede restringir la recopilación o el uso de la información personal que se proporciona a nuestro sitio web. Cada vez que se le solicita rellenar un formulario, como el de alta de usuario, puede marcar o desmarcar la opción de recibir información por correo electrónico. En caso de que haya marcado la opción de recibir nuestro boletín o publicidad usted puede cancelarla en cualquier momento.

Esta compañía no venderá, cederá ni distribuirá la información personal que es recopilada sin su consentimiento, salvo que sea requerida por un juez con una orden judicial.

Kidsfun y Fiestas Infantiles Se reserva el derecho de cambiar los términos de la presente Política de Privacidad en cualquier momento.`;

/**
 * Traducción al inglés del texto legal por defecto.
 * Se incluye en el PDF y el email para que el cliente tenga ambas versiones.
 */
export const DEFAULT_WAIVER_TEXT_EN = `August 04, 2024
PRIVACY POLICY

This Privacy Policy establishes the terms under which Kidsfun y Fiestas Infantiles uses and protects the information provided by its users when using its website. This company is committed to the security of its users' data. When we ask you to fill in personal information fields by which you may be identified, we do so ensuring that it will only be used in accordance with the terms of this document. However, this Privacy Policy may change over time or be updated, so we recommend and emphasize that you continuously review this page to ensure that you agree with such changes.

Information Collected

Our website may collect personal information such as: Name, contact information like your email address, and demographic information. Likewise, when necessary, specific information may be required to process an order or to make a delivery or billing.

Use of Collected Information

Our website uses the information in order to provide the best possible service, particularly to maintain a record of users, of orders where applicable, and to improve our products and services. Periodic emails may be sent through our site with special offers, new products, and other advertising information that we consider relevant to you or that may provide you with some benefit. These emails will be sent to the address you provide and may be canceled at any time.

Kidsfun y Fiestas Infantiles is highly committed to fulfilling its commitment to keeping your information secure. We use the most advanced systems and constantly update them to ensure that no unauthorized access occurs.

Cookies

A cookie refers to a file that is sent with the purpose of requesting permission to be stored on your computer. By accepting this file, the cookie is created and then serves to obtain information regarding web traffic, and also facilitates future visits to a recurring website. Another function of cookies is that with them, websites can recognize you individually and therefore provide you with the best personalized service on their website.

Our website uses cookies to identify the pages that are visited and their frequency. This information is used solely for statistical analysis and the information is then permanently deleted. You can delete cookies at any time from your computer. However, cookies help provide a better service on websites; they do not give access to information from your computer or about you, unless you so wish and directly provide it. You may accept or decline the use of cookies, however most browsers automatically accept cookies since they serve to provide a better web service. You may also change your computer's settings to reject cookies. If declined, you may not be able to use some of our services.

Third-Party Links

This website may contain links to other sites that may be of interest to you. Once you click on these links and leave our page, we no longer have control over the site to which you are redirected and therefore we are not responsible for the terms, privacy, or protection of your data on those other third-party sites. Such sites are subject to their own privacy policies, so it is recommended that you consult them to confirm that you agree with them.

Control of Your Personal Information

At any time you may restrict the collection or use of the personal information provided to our website. Each time you are asked to fill in a form, such as the user registration form, you can check or uncheck the option to receive information by email. If you have checked the option to receive our newsletter or advertising, you may cancel it at any time.

This company will not sell, transfer, or distribute the personal information that is collected without your consent, unless required by a judge with a court order.

Kidsfun y Fiestas Infantiles reserves the right to change the terms of this Privacy Policy at any time.`;

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

  async generateWaiverPdf(data: WaiverPdfData): Promise<Uint8Array> {
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
      const watermarkPath = path.join(process.cwd(), 'apps/api/src/assets/favicon-watermark.png');
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
      this.logger.warn('No se pudo cargar la marca de agua del favicon para el PDF');
    }

    // === HEADER: Logo - Título - QR (3 columnas) ===
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
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

    const fechaStr = data.createdAt.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    page.drawText(`FECHA DE EMISIÓN: ${fechaStr}`, { x: margin, y, size: 10, font: helveticaBold });
    y -= 18;

    if (data.expiresAt) {
      const expStr = new Date(data.expiresAt).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      page.drawText(`VIGENCIA HASTA: ${expStr}`, { x: margin, y, size: 10, font: helveticaBold, color: this.primary });
      y -= 18;
    }

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

    // === TÉRMINOS Y CONDICIONES (BILINGÜE: ES + EN) ===
    const spanishText = data.legalText && data.legalText.trim().length > 0 ? data.legalText : DEFAULT_WAIVER_TEXT;
    const englishText = DEFAULT_WAIVER_TEXT_EN;

    const renderLegalSection = (title: string, content: string, contTitle: string) => {
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

    if (spanishText) {
      renderLegalSection(
        'POLÍTICA DE PRIVACIDAD Y TÉRMINOS (ES)',
        spanishText,
        'POLÍTICA DE PRIVACIDAD Y TÉRMINOS (ES) — Continuación',
      );
    }

    // Separador visual entre idiomas
    y -= 6;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.6,
      color: this.gray,
    });
    y -= 14;

    if (englishText) {
      renderLegalSection(
        'PRIVACY POLICY AND TERMS (EN)',
        englishText,
        'PRIVACY POLICY AND TERMS (EN) — Continued',
      );
    }

    // === FIRMAS ===
    if (y < margin + 80) {
      const newPage = doc.addPage([612, 792]);
      page = newPage;
      y = height - margin - 40;
    }

    page.drawText('ACEPTACIÓN Y FIRMA', {
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
