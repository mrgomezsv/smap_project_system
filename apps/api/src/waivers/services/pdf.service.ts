import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { QrService } from './qr.service';

export const DEFAULT_WAIVER_TEXT = `POLÍTICA DE PRIVACIDAD

El presente Política de Privacidad establece los términos en que Kidsfun y Fiestas Infantiles usa y protege la información que es proporcionada por sus usuarios al momento de utilizar su sitio web. Esta compañía está comprometida con la seguridad de los datos de sus usuarios. Cuando le pedimos llenar los campos de información personal con la cual usted pueda ser identificado, lo hacemos asegurando que sólo se empleará de acuerdo con los términos de este documento. Sin embargo esta Política de Privacidad puede cambiar con el tiempo o ser actualizada por lo que le recomendamos y enfatizamos revisar continuamente esta página para asegurarse que está de acuerdo con dichos cambios.

Información que es recogida
Nuestro sitio web podrá recoger información personal por ejemplo: Nombre, información de contacto como su dirección de correo electrónica e información demográfica. Así mismo cuando sea necesario podrá ser requerida información específica para procesar algún pedido o realizar una entrega o facturación.

Uso de la información recogida
Nuestro sitio web emplea la información con el fin de proporcionar el mejor servicio posible, particularmente para mantener un registro de usuarios, de pedidos en caso que aplique, y mejorar nuestros productos y servicios. Es posible que sean enviados correos electrónicos periódicamente a través de nuestro sitio con ofertas especiales, nuevos productos y otra información publicitaria que consideremos relevante para usted o que pueda brindarle algún beneficio, estos correos electrónicos serán enviados a la dirección que usted proporcione y podrán ser cancelados en cualquier momento.

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
    let page = doc.addPage([612, 792]); // Letter size
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
    const legalTextToUse = data.legalText && data.legalText.trim().length > 0 ? data.legalText : DEFAULT_WAIVER_TEXT;

    if (legalTextToUse) {
      page.drawText('POLÍTICA DE PRIVACIDAD Y TÉRMINOS', {
        x: margin,
        y,
        size: 11,
        font: helveticaBold,
        color: this.primary,
      });
      y -= 16;

      const maxWidth = width - 2 * margin;
      const paragraphs = legalTextToUse.split('\n');
      
      for (const para of paragraphs) {
        if (!para.trim()) {
          y -= 6;
          continue;
        }
        const lines = this.wrapText(para.trim(), maxWidth, helvetica, 8);
        for (const line of lines) {
          if (y < margin + 90) {
            // Si el texto legal no cabe en la primera página antes de las firmas,
            // creamos una nueva página de continuación
            const newPage = doc.addPage([612, 792]);
            page = newPage;
            y = height - margin;
            page.drawText('POLÍTICA DE PRIVACIDAD (Continuación)', {
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
        y -= 4; // espacio entre párrafos
      }
      y -= 10;
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
