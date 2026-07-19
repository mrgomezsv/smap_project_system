import { Injectable } from '@nestjs/common';
import * as qrcode from 'qrcode';

/**
 * Servicio de generación de códigos QR.
 * Wrapper sobre la librería qrcode para generar PNG/DataURL.
 */
@Injectable()
export class QrService {
  /**
   * Genera un QR como buffer PNG.
   */
  async toBuffer(text: string): Promise<Buffer> {
    return qrcode.toBuffer(text, {
      errorCorrectionLevel: 'M',
      type: 'png',
      margin: 1,
      width: 300,
    });
  }

  /**
   * Genera un QR como data URL base64 (útil para embeber en HTML).
   */
  async toDataUrl(text: string): Promise<string> {
    return qrcode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
    });
  }
}
