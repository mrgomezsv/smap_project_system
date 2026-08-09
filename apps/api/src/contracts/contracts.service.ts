import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../waivers/services/email.service';
import { ContractPdfService } from './services/contract-pdf.service';
import { CreateContractDto, SignContractDto } from './dto/contract.dto';
import * as crypto from 'crypto';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly pdfService: ContractPdfService,
  ) {}

  async createContract(dto: CreateContractDto) {
    const token = crypto.randomBytes(24).toString('hex');

    const contract = await this.prisma.rentalContract.create({
      data: {
        token,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        clientPhone: dto.clientPhone || null,
        clientAddress: dto.clientAddress,
        clientCityStateZip: dto.clientCityStateZip || null,
        driverLicense: dto.driverLicense || null,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : null,
        startTime: dto.startTime || null,
        endTime: dto.endTime || null,
        equipment: dto.equipment,
        groundType: dto.groundType || null,
        price: dto.price !== undefined ? dto.price : null,
        deposit: dto.deposit !== undefined ? dto.deposit : null,
        notes: dto.notes || null,
        status: 'PENDING',
      },
    });

    const webBaseUrl = process.env.PUBLIC_WEB_URL || process.env.SITE_URL || 'http://localhost:3000';
    const signUrl = `${webBaseUrl}/contrato/firmar/${token}`;

    let emailSent = false;
    try {
      const { subject, html } = this.emailService.getContractInviteEmailTemplate({
        clientName: contract.clientName,
        equipment: contract.equipment,
        signUrl,
        eventDate: contract.eventDate ? new Date(contract.eventDate).toLocaleDateString() : null,
      });

      emailSent = await this.emailService.send({
        to: contract.clientEmail,
        subject,
        html,
      });
    } catch (e) {
      this.logger.error(`Error al enviar invitación por email a ${contract.clientEmail}:`, e);
    }

    return {
      contract,
      signUrl,
      emailSent,
    };
  }

  async findAll(query?: { search?: string; status?: string; skip?: number; take?: number; cursor?: number }) {
    const where: any = {};
    if (query?.status) where.status = query.status;
    // FULLTEXT para búsquedas largas (>=3 chars), LIKE para términos cortos
    if (query?.search) {
      const term = query.search.trim();
      where.OR = [
        { clientName: { contains: term } },
        { clientEmail: { contains: term } },
        { equipment: { contains: term } },
      ];
    }

    const take = query?.take ? Number(query.take) : 50;
    const skip = query?.skip ? Number(query.skip) : 0;
    const useCursor = !!query?.cursor;

    // Build findMany args sin spreads ambiguos
    const findManyArgs: any = {
      where,
      orderBy: { id: 'desc' },
      take,
      select: {
        id: true,
        token: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        eventDate: true,
        equipment: true,
        status: true,
        price: true,
        deposit: true,
        createdAt: true,
        signedAt: true,
      },
    };
    if (useCursor) {
      findManyArgs.cursor = { id: Number(query!.cursor) };
      findManyArgs.skip = 1; // saltar el cursor mismo
    } else {
      findManyArgs.skip = skip;
    }

    const items = await this.prisma.rentalContract.findMany(findManyArgs);
    // El count solo aplica a paginación por OFFSET. Con cursor no se devuelve total
    // (es caro y no es necesario para UI de scroll infinito).
    const total = useCursor ? null : await this.prisma.rentalContract.count({ where });

    // Próximo cursor: id del último item devuelto, o null si no hay más
    const nextCursor = items.length === take ? items[items.length - 1].id : null;

    return {
      items,
      total,
      skip: useCursor ? null : skip,
      take,
      nextCursor,
      hasMore: nextCursor !== null,
    };
  }

  async findByToken(token: string) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { token },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado o enlace inválido.');
    }

    return contract;
  }

  async signContract(token: string, dto: SignContractDto) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { token },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado.');
    }

    if (contract.status === 'SIGNED') {
      throw new BadRequestException('Este contrato ya fue firmado anteriormente.');
    }

    if (!dto.signatureImage) {
      throw new BadRequestException('La firma electrónica es obligatoria.');
    }

    const updated = await this.prisma.rentalContract.update({
      where: { token },
      data: {
        status: 'SIGNED',
        signatureImage: dto.signatureImage,
        // Mantener Json en safetyChecklist por retrocompatibilidad (dual-write durante migración).
        // La fuente de verdad ahora es t_app_contract_safety_item.
        safetyChecklist: dto.safetyChecklist ? JSON.parse(JSON.stringify(dto.safetyChecklist)) : null,
        signedAt: new Date(),
        signerIp: dto.signerIp || null,
        signerUserAgent: dto.signerUserAgent || null,
      },
    });

    // Persistir cada item del checklist en la tabla normalizada.
    // Si la tabla falla, el Json legacy sigue siendo válido (defensa en profundidad).
    if (dto.safetyChecklist && Object.keys(dto.safetyChecklist).length > 0) {
      try {
        await this.prisma.contractSafetyItem.createMany({
          data: Object.entries(dto.safetyChecklist).map(([itemKey, isChecked]) => ({
            contractId: updated.id,
            itemKey,
            isChecked: Boolean(isChecked),
          })),
          skipDuplicates: true, // (contract_id, item_key) es UNIQUE
        });
      } catch (e) {
        this.logger.warn(
          `No se pudo persistir safety items en tabla normalizada (contrato ${updated.id}): ${(e as Error).message}. ` +
          'El checklist sigue disponible en la columna Json legacy.',
        );
      }
    }

    // Generar PDF y enviar por correo al cliente y administrador
    try {
      const pdfBuffer = await this.pdfService.generatePdf({
        token: updated.token,
        clientName: updated.clientName,
        clientEmail: updated.clientEmail,
        clientPhone: updated.clientPhone,
        clientAddress: updated.clientAddress,
        clientCityStateZip: updated.clientCityStateZip,
        driverLicense: updated.driverLicense,
        eventDate: updated.eventDate,
        startTime: updated.startTime,
        endTime: updated.endTime,
        equipment: updated.equipment,
        groundType: updated.groundType,
        price: updated.price ? Number(updated.price) : null,
        deposit: updated.deposit ? Number(updated.deposit) : null,
        notes: updated.notes,
        signedAt: updated.signedAt,
        signerIp: updated.signerIp,
        signerUserAgent: updated.signerUserAgent,
        signatureImage: updated.signatureImage,
        safetyChecklist: updated.safetyChecklist as Record<string, boolean>,
      });

      const { subject, html } = this.emailService.getContractSignedEmailTemplate({
        clientName: updated.clientName,
        equipment: updated.equipment,
      });

      // Enviar copia al cliente con el PDF adjunto
      await this.emailService.send({
        to: updated.clientEmail,
        subject,
        html,
        attachments: [
          {
            filename: `Rental_Agreement_${updated.clientName.replace(/\s+/g, '_')}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      // Enviar copia al correo de la empresa si está configurado
      const adminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_FROM || 'info@kidsfunyfiestasinfantiles.com';
      await this.emailService.send({
        to: adminNotifyEmail,
        subject: `[ADMIN COPY] Signed Contract: ${updated.clientName}`,
        html: `<p>Se ha firmado un nuevo contrato de alquiler para <strong>${updated.clientName}</strong> (${updated.equipment}). Se adjunta la copia firmada en PDF.</p>`,
        attachments: [
          {
            filename: `Rental_Agreement_${updated.clientName.replace(/\s+/g, '_')}_ADMIN.pdf`,
            content: pdfBuffer,
          },
        ],
      });
    } catch (e) {
      this.logger.error('Error generando o enviando el PDF firmado:', e);
    }

    return updated;
  }

  async getPdfBufferByToken(token: string): Promise<Buffer> {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { token },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado.');
    }

    return this.pdfService.generatePdf({
      token: contract.token,
      clientName: contract.clientName,
      clientEmail: contract.clientEmail,
      clientPhone: contract.clientPhone,
      clientAddress: contract.clientAddress,
      clientCityStateZip: contract.clientCityStateZip,
      driverLicense: contract.driverLicense,
      eventDate: contract.eventDate,
      startTime: contract.startTime,
      endTime: contract.endTime,
      equipment: contract.equipment,
      groundType: contract.groundType,
      price: contract.price ? Number(contract.price) : null,
      deposit: contract.deposit ? Number(contract.deposit) : null,
      notes: contract.notes,
      signedAt: contract.signedAt,
      signerIp: contract.signerIp,
      signerUserAgent: contract.signerUserAgent,
      signatureImage: contract.signatureImage,
      safetyChecklist: contract.safetyChecklist as Record<string, boolean>,
    });
  }
}
