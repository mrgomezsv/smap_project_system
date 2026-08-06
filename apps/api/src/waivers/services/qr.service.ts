import { Injectable, Logger } from '@nestjs/common';
import * as qrcode from 'qrcode';
import sharp from 'sharp';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Servicio de generación de códigos QR personalizados.
 * Genera QR con margen limpio en los 4 lados y logo/favicon incrustado en el centro.
 */
@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);
  private logoBuffer: Buffer | null = null;

  constructor() {
    this.loadLogo();
  }

  private loadLogo() {
    try {
      const possiblePaths = [
        join(process.cwd(), 'apps/api/src/assets/favicon-watermark.png'),
        join(process.cwd(), 'src/assets/favicon-watermark.png'),
        join(process.cwd(), 'apps/api/src/assets/logo.png'),
        join(process.cwd(), 'src/assets/logo.png'),
      ];
      for (const p of possiblePaths) {
        if (existsSync(p)) {
          this.logoBuffer = readFileSync(p);
          this.logger.log(`Logo para QR cargado correctamente desde ${p}`);
          break;
        }
      }
    } catch (e) {
      this.logger.warn('No se pudo cargar el logo para marca de agua en QR', e);
    }
  }

  /**
   * Genera un QR personalizado como buffer PNG:
   * 1. Borde / Margen blanco de 4 módulos en los 4 lados.
   * 2. Nivel de corrección de errores 'H' (30% de tolerancia).
   * 3. Logo/Favicon incrustado en el centro sobre una tarjeta blanca limpia.
   */
  async toBuffer(text: string): Promise<Buffer> {
    const qrSize = 400;
    const margin = 4;

    // Generar QR base con margen 4 y nivel H
    const qrBuffer = await qrcode.toBuffer(text, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin,
      width: qrSize,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    if (!this.logoBuffer) {
      return qrBuffer;
    }

    try {
      const logoSize = 84;
      const bgSize = 100;

      const resizedLogo = await sharp(this.logoBuffer)
        .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toBuffer();

      // SVG para la tarjeta blanca con esquinas redondeadas
      const whiteCardSvg = Buffer.from(`
        <svg width="${bgSize}" height="${bgSize}">
          <rect x="0" y="0" width="${bgSize}" height="${bgSize}" rx="20" ry="20" fill="#FFFFFF" />
        </svg>
      `);

      const compositeQr = await sharp(qrBuffer)
        .composite([
          {
            input: whiteCardSvg,
            top: Math.round((qrSize - bgSize) / 2),
            left: Math.round((qrSize - bgSize) / 2),
          },
          {
            input: resizedLogo,
            top: Math.round((qrSize - logoSize) / 2),
            left: Math.round((qrSize - logoSize) / 2),
          },
        ])
        .png()
        .toBuffer();

      return compositeQr;
    } catch (e) {
      this.logger.warn('Fallo al superponer el logo en el QR, devolviendo QR estándar con borde', e);
      return qrBuffer;
    }
  }

  /**
   * Genera un QR como data URL base64.
   */
  async toDataUrl(text: string): Promise<string> {
    const buffer = await this.toBuffer(text);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }
}
