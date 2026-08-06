import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaiverDto, RelativeDto } from './dto/create-waiver.dto';
import { PdfService } from './services/pdf.service';
import { EmailService } from './services/email.service';
import * as crypto from 'crypto';

@Injectable()
export class WaiversService {
  private readonly logger = new Logger(WaiversService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly emailService: EmailService,
  ) { }

  /**
   * Genera un código QR único de 8 caracteres (equivalente al uuid4()[:8] de Django).
   */
  private generateUniqueQr(): string {
    return crypto.randomBytes(8).toString('hex').substring(0, 8).toUpperCase();
  }

  /**
   * Crea un nuevo waiver con QR, familiares, PDF y email.
   */
  async create(
    userId: string,
    dto: CreateWaiverDto,
  ): Promise<{
    waiver: unknown;
    qrCode: string;
    emailSent: boolean;
    pdfSize: number;
  }> {
    // Generar QR único (reintentar si ya existe)
    let qrCode = this.generateUniqueQr();
    let attempts = 0;
    while (await this.prisma.waiverQRV2.findUnique({ where: { qrCode } })) {
      qrCode = this.generateUniqueQr();
      if (++attempts > 10) {
        throw new BadRequestException('No se pudo generar un QR único');
      }
    }

    // Calcular expiresAt = medianoche del día actual
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setHours(23, 59, 59, 999);

    // Crear el waiver con sus familiares
    const waiver = await this.prisma.waiverQRV2.create({
      data: {
        qrCode,
        userId,
        userName: dto.userName,
        userEmail: dto.userEmail,
        userPhone: dto.userPhone ?? null,
        expiresAt,
        status: 'ACTIVE',
        relatives: {
          create: (dto.relatives || []).map((r: RelativeDto) => ({
            relativeName: r.name,
            relativeAge: r.age,
          })),
        },
      },
      include: { relatives: true },
    });

    // Generar PDF y enviar email sin romper la creación del waiver si el envío falla
    let emailSent = false;
    let pdfBytes: Uint8Array | null = null;

    try {
      pdfBytes = await this.pdfService.generateWaiverPdf({
        qrCode: waiver.qrCode,
        userName: waiver.userName,
        userId: waiver.userId,
        userEmail: waiver.userEmail,
        userPhone: waiver.userPhone ?? undefined,
        createdAt: waiver.createdAt,
        relatives: waiver.relatives.map((r) => ({ name: r.relativeName, age: r.relativeAge })),
        legalText: await this.getLegalText(),
      });

      const { subject, html } = this.emailService.getWaiverEmailTemplate({
        userName: dto.userName,
        userEmail: dto.userEmail,
        userPhone: dto.userPhone,
        relatives: dto.relatives?.map((r) => ({ name: r.name, age: r.age })),
        qrCode,
        lang: 'es',
      });

      emailSent = await this.emailService.send({
        to: dto.userEmail,
        subject,
        html,
        attachments: [
          {
            filename: `waiver_${qrCode}.pdf`,
            content: Buffer.from(pdfBytes),
            contentType: 'application/pdf',
          },
        ],
      });
    } catch (err: any) {
      this.logger.error(`Error procesando PDF o Email para el waiver ${qrCode}: ${err.message}`, err.stack);
    }

    return {
      waiver,
      qrCode: waiver.qrCode,
      emailSent,
      pdfSize: pdfBytes ? pdfBytes.length : 0,
    };
  }

  /**
   * Reenvía un waiver por correo electrónico
   */
  async resendWaiverEmail(qrCode: string, lang: 'es' | 'en' = 'es'): Promise<boolean> {
    const waiver = await this.prisma.waiverQRV2.findUnique({
      where: { qrCode: qrCode.toUpperCase() },
      include: { relatives: true },
    });

    if (!waiver) {
      throw new NotFoundException(`Waiver con QR ${qrCode} no encontrado`);
    }

    const pdfBytes = await this.pdfService.generateWaiverPdf({
      qrCode: waiver.qrCode,
      userName: waiver.userName,
      userId: waiver.userId,
      userEmail: waiver.userEmail,
      userPhone: waiver.userPhone ?? undefined,
      createdAt: waiver.createdAt,
      relatives: waiver.relatives.map((r) => ({ name: r.relativeName, age: r.relativeAge })),
      legalText: await this.getLegalText(),
    });

    const { subject, html } = this.emailService.getWaiverEmailTemplate({
      userName: waiver.userName,
      userEmail: waiver.userEmail,
      userPhone: waiver.userPhone ?? undefined,
      relatives: waiver.relatives.map((r) => ({ name: r.relativeName, age: r.relativeAge })),
      createdAt: waiver.createdAt,
      qrCode: waiver.qrCode,
      lang,
    });

    return this.emailService.send({
      to: waiver.userEmail,
      subject,
      html,
      attachments: [
        {
          filename: `waiver_${waiver.qrCode}.pdf`,
          content: Buffer.from(pdfBytes),
          contentType: 'application/pdf',
        },
      ],
    });
  }

  /**
   * Obtiene un waiver por código QR y actualiza su status si expiró.
   */
  async findByQr(qrCode: string) {
    const waiver = await this.prisma.waiverQRV2.findUnique({
      where: { qrCode: qrCode.toUpperCase() },
      include: { relatives: true },
    });
    if (!waiver) {
      throw new NotFoundException(`Waiver con QR ${qrCode} no encontrado`);
    }
    this.updateStatusIfExpired(waiver);
    return {
      waiver,
      isValid: waiver.status === 'ACTIVE' && !this.isExpired(waiver.expiresAt),
    };
  }

  /**
   * Lista los waivers de un usuario. Solo el propio user puede ver sus waivers.
   */
  async findByUser(requestingUserId: string, targetUserId: string) {
    if (requestingUserId !== targetUserId) {
      throw new BadRequestException('Solo puedes ver tus propios waivers');
    }
    const waivers = await this.prisma.waiverQRV2.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      include: { relatives: true, scans: true },
    });
    // Actualizar estados
    for (const w of waivers) {
      this.updateStatusIfExpired(w);
    }
    return { waivers, totalCount: waivers.length };
  }

  /**
   * Valida un QR y registra el scan si es válido.
   * Devuelve valid: boolean + datos del waiver.
   */
  async validate(qrCode: string, scannedBy: string) {
    const waiver = await this.prisma.waiverQRV2.findUnique({
      where: { qrCode: qrCode.toUpperCase() },
      include: { relatives: true },
    });
    if (!waiver) {
      return { valid: false, message: 'QR no encontrado' };
    }

    this.updateStatusIfExpired(waiver);
    const isValid = waiver.status === 'ACTIVE' && !this.isExpired(waiver.expiresAt);

    if (isValid) {
      await this.prisma.waiverScanV2.create({
        data: { waiverQrId: waiver.id, scannedBy },
      });
    }

    return {
      valid: isValid,
      waiver,
      message: isValid
        ? 'Waiver validado y escaneo registrado con éxito'
        : 'Waiver expirado o inactivo',
    };
  }

  /**
   * Genera el PDF para descarga por parte del admin.
   */
  async generatePdf(qrCode: string): Promise<Buffer> {
    const waiver = await this.prisma.waiverQRV2.findUnique({
      where: { qrCode: qrCode.toUpperCase() },
      include: { relatives: true },
    });
    if (!waiver) {
      throw new NotFoundException(`Waiver con QR ${qrCode} no encontrado`);
    }
    const pdfBytes = await this.pdfService.generateWaiverPdf({
      qrCode: waiver.qrCode,
      userName: waiver.userName,
      userId: waiver.userId,
      userEmail: waiver.userEmail,
      userPhone: waiver.userPhone ?? undefined,
      createdAt: waiver.createdAt,
      expiresAt: waiver.expiresAt,
      relatives: waiver.relatives.map((r) => ({ name: r.relativeName, age: r.relativeAge })),
      legalText: await this.getLegalText(),
    });
    return Buffer.from(pdfBytes);
  }

  /**
   * Historial de scans del colaborador actual (por su email).
   */
  async getCollaboratorScans(email: string) {
    const scans = await this.prisma.waiverScanV2.findMany({
      where: { scannedBy: email },
      orderBy: { scannedAt: 'desc' },
      include: { waiverQr: true },
    });
    return { scans, totalCount: scans.length };
  }

  /**
   * Listado paginado de TODOS los waivers (uso admin).
   * Side-effects: actualiza status si expiraron (fire-and-forget).
   */
  async findAll(opts: { take: number; skip: number; status?: string }) {
    const where: { status?: string } = {};
    if (opts.status === 'ACTIVE' || opts.status === 'INACTIVE') {
      where.status = opts.status;
    }

    const [waivers, totalCount] = await Promise.all([
      this.prisma.waiverQRV2.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: opts.take,
        skip: opts.skip,
        include: { relatives: true, scans: true },
      }),
      this.prisma.waiverQRV2.count({ where }),
    ]);

    for (const w of waivers) {
      this.updateStatusIfExpired(w);
    }

    return {
      waivers,
      totalCount,
      hasMore: opts.skip + waivers.length < totalCount,
      page: {
        take: opts.take,
        skip: opts.skip,
      },
    };
  }

  /**
   * Elimina uno o más waivers por ID/bigint.
   */
  async deleteMany(ids: (string | number)[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('Debes proporcionar al menos un ID para eliminar');
    }
    const numericIds = ids.map((id) => (typeof id === 'string' ? BigInt(id) : BigInt(id)));
    // Primero eliminar familiares y scans relacionados en cascada o explicitamente
    await this.prisma.waiverDataV2.deleteMany({
      where: { waiverQrId: { in: numericIds } },
    });
    await this.prisma.waiverScanV2.deleteMany({
      where: { waiverQrId: { in: numericIds } },
    });
    const result = await this.prisma.waiverQRV2.deleteMany({
      where: { id: { in: numericIds } },
    });
    return { count: result.count, success: true };
  }

  // === HELPERS ===

  private isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  private updateStatusIfExpired(waiver: { expiresAt: Date; status: string; id: bigint }) {
    if (this.isExpired(waiver.expiresAt) && waiver.status === 'ACTIVE') {
      // Fire-and-forget update (no bloqueamos la respuesta)
      this.prisma.waiverQRV2
        .update({ where: { id: waiver.id }, data: { status: 'INACTIVE' } })
        .catch((e) => this.logger.error(`Error actualizando status waiver: ${e.message}`));
    }
  }

  private async getLegalText(): Promise<string | undefined> {
    const doc = await this.prisma.waiverDocument.findFirst();
    return doc?.content;
  }

  private buildEmailHtml(
    dto: CreateWaiverDto,
    qrCode: string,
  ): string {
    const relativesRows = (dto.relatives || [])
      .map(
        (r) =>
          `<tr><td style="padding:8px;border:1px solid #ddd">${r.name}</td><td style="padding:8px;border:1px solid #ddd">${r.age}</td></tr>`,
      )
      .join('');

    const contactRow = dto.userPhone
      ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Teléfono</strong></td><td style="padding:8px;border:1px solid #ddd">${dto.userPhone}</td></tr>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #0F172A; max-width: 600px; margin: 0 auto;">
  <div style="background: #F5A91B; padding: 20px; text-align: center;">
    <h1 style="margin: 0; color: white;">KIDSFUN</h1>
    <p style="margin: 0; color: white;">Fiestas Infantiles</p>
  </div>
  <div style="padding: 30px; background: #FAFAFA;">
    <h2 style="color: #1E3A8A;">Confirmación de Waiver</h2>
    <p>Hola <strong>${dto.userName}</strong>,</p>
    <p>Tu código QR de acceso es:</p>
    <div style="background: white; border: 2px solid #1E3A8A; padding: 20px; text-align: center; margin: 20px 0;">
      <h1 style="color: #1E3A8A; letter-spacing: 4px; margin: 0;">${qrCode}</h1>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead><tr><th style="padding:8px;border:1px solid #ddd;background:#1E3A8A;color:white;text-align:left;" colspan="2">Datos del titular</th></tr></thead>
      <tbody>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Nombre</strong></td><td style="padding:8px;border:1px solid #ddd">${dto.userName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd">${dto.userEmail}</td></tr>
        ${contactRow}
      </tbody>
    </table>
    <p>Adjunto encontrarás el PDF del waiver firmado con tu código QR y los datos de tus familiares registrados:</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead><tr><th style="padding:8px;border:1px solid #ddd;background:#1E3A8A;color:white;text-align:left;">Nombre</th><th style="padding:8px;border:1px solid #ddd;background:#1E3A8A;color:white;text-align:left;">Edad</th></tr></thead>
      <tbody>${relativesRows}</tbody>
    </table>
    <p style="margin-top: 30px;">Muestra este código QR o el PDF al personal en la entrada del evento.</p>
  </div>
  <div style="background: #0F172A; padding: 15px; text-align: center; color: white; font-size: 12px;">
    © ${new Date().getFullYear()} Kidsfun y Fiestas Infantiles
  </div>
</body>
</html>
    `;
  }
}
