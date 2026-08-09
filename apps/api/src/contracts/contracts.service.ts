import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, RentalContract } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../waivers/services/email.service';
import { ContractPdfService } from './services/contract-pdf.service';
import { ContractStorageService } from './services/contract-storage.service';
import { ClientsService } from '../clients/clients.service';
import {
  CreateContractDto,
  SignContractDto,
  UpdateContractDto,
  CancelContractDto,
  CreateContractPaymentDto,
  UploadContractDocumentDto,
  QueryContractsDto,
} from './dto/contract.dto';
import {
  detectMimeFromBuffer,
  extensionForMime,
} from './services/contract-storage.service';
import * as crypto from 'crypto';

export const CONTRACT_TOKEN_TTL_DAYS = 7;
export const CONTRACT_PUBLIC_SAFETY_ITEMS = [
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

export const PUBLIC_CHECKLIST_KEYS: readonly string[] =
  CONTRACT_PUBLIC_SAFETY_ITEMS.map((_label, i) => `check_${i}`);

export const SIGNATURE_BASE64_PREFIX = 'data:image/png;base64,';
export const SIGNATURE_MAX_BYTES = 2 * 1024 * 1024;
const SIGNATURE_MIN_BYTES = 200;

export interface ContractPublicView {
  id: number;
  token: string;
  status: string;
  expiresAt: Date | null;
  viewedAt: Date | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  clientAddress: string;
  clientCityStateZip: string | null;
  eventDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  equipment: string;
  groundType: string | null;
  price: Prisma.Decimal | number | null;
  deposit: Prisma.Decimal | number | null;
  notes: string | null;
  signedAt: Date | null;
  checklistItems: { key: string; label: string }[];
}

export interface ContractAdminDetail {
  id: number;
  token: string;
  status: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  clientAddress: string;
  clientCityStateZip: string | null;
  driverLicense: string | null;
  eventDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  equipment: string;
  groundType: string | null;
  price: Prisma.Decimal | number | null;
  deposit: Prisma.Decimal | number | null;
  notes: string | null;
  signedAt: Date | null;
  signatureMethod: string | null;
  signerIp: string | null;
  expiresAt: Date | null;
  viewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdById: number | null;
  client: {
    id: number;
    email: string;
    name: string;
    phone: string | null;
    userId: number | null;
  } | null;
  documents: Array<{
    id: bigint;
    contractId: number;
    paymentId: bigint | null;
    kind: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    sha256: string;
    storagePath: string;
    uploadedById: number | null;
    createdAt: Date;
  }>;
  payments: Array<{
    id: bigint;
    contractId: number;
    type: string;
    amount: Prisma.Decimal | number;
    method: string;
    reference: string | null;
    notes: string | null;
    paidAt: Date;
    createdAt: Date;
  }>;
  totals: {
    totalPaid: number;
    balanceDue: number;
    price: number;
    deposit: number;
  };
}

export interface SignRequestMeta {
  signerIp: string;
  signerUserAgent: string;
}

export interface CreateContractResult {
  contract: RentalContract;
  signUrl: string;
  emailSent: boolean;
  documentId: bigint | null;
}

export interface SignContractResult {
  id: number;
  token: string;
  status: string;
  signedAt: Date | null;
  signedDocumentId: bigint | null;
  emailSent: boolean;
  adminEmailSent: boolean;
}

const SIGNED_KINDS = ['ELECTRONIC_SIGNED_PDF', 'UPLOADED_SIGNED_PDF'] as const;

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly pdfService: ContractPdfService,
    private readonly storageService: ContractStorageService,
    private readonly clientsService: ClientsService,
  ) {}

  async createContract(
    dto: CreateContractDto,
    actorUserId: number | null,
  ): Promise<CreateContractResult> {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = this.computeExpiry(new Date());

    const client = await this.clientsService.resolveForContract({
      clientId: dto.clientId ?? null,
      email: dto.clientEmail,
      name: dto.clientName,
    });

    const contract = await this.prisma.rentalContract.create({
      data: {
        token,
        clientId: client?.id ?? null,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail.toLowerCase(),
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
        expiresAt,
        createdById: actorUserId,
      },
    });

    if (dto.deposit !== undefined && dto.deposit !== null && dto.deposit > 0) {
      try {
        await this.prisma.contractPayment.create({
          data: {
            contractId: contract.id,
            type: 'DEPOSIT',
            amount: dto.deposit,
            method: 'manual',
            notes: 'deposit-on-create',
            paidAt: new Date(),
            createdById: actorUserId,
          },
        });
      } catch (e) {
        await this.cleanupContractArtifacts(contract.id);
        throw e;
      }
    }

    let documentId: bigint | null = null;
    try {
      const pdfBuffer = await this.pdfService.generatePdf({
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
        signedAt: null,
        signerIp: null,
        signerUserAgent: null,
        signatureImage: null,
        safetyChecklist: null,
      });

      const saved = await this.storageService.save({
        contractId: contract.id,
        ownerLabel: client
          ? `${client.id}-${this.slugify(client.name)}`
          : 'manual',
        clientSlug: client ? this.slugify(client.name) : 'manual',
        kind: 'ISSUED_PDF',
        originalFilename: `Rental_Agreement_${contract.id}.pdf`,
        buffer: pdfBuffer,
        extension: '.pdf',
      });

      try {
        const doc = await this.prisma.contractDocument.create({
          data: {
            contractId: contract.id,
            paymentId: null,
            kind: 'ISSUED_PDF',
            originalFilename: saved.sanitizedFilename,
            mimeType: 'application/pdf',
            sizeBytes: saved.sizeBytes,
            sha256: saved.sha256,
            storagePath: saved.storagePath,
            uploadedById: actorUserId,
          },
        });
        documentId = doc.id;
      } catch (dbErr) {
        await this.storageService.remove(saved.storagePath);
        await this.cleanupContractArtifacts(contract.id);
        throw dbErr;
      }
    } catch (e) {
      this.logger.error(
        `No se pudo generar/almacenar PDF emitido para contrato ${contract.id}: ${(e as Error).message}`,
      );
      await this.cleanupContractArtifacts(contract.id);
      throw new InternalServerErrorException(
        'No se pudo emitir el PDF del contrato. Inténtalo de nuevo.',
      );
    }

    const webBaseUrl =
      process.env.PUBLIC_WEB_URL ||
      process.env.SITE_URL ||
      'http://localhost:3000';
    const signUrl = `${webBaseUrl}/contrato/firmar/${token}`;

    let emailSent = false;
    try {
      const { subject, html } =
        this.emailService.getContractInviteEmailTemplate({
          clientName: contract.clientName,
          equipment: contract.equipment,
          signUrl,
          eventDate: contract.eventDate
            ? new Date(contract.eventDate).toLocaleDateString()
            : null,
        });

      emailSent = await this.emailService.send({
        to: contract.clientEmail,
        subject,
        html,
      });
    } catch (e) {
      this.logger.error(
        `Error al enviar invitación por email a ${contract.clientEmail}: ${(e as Error).message}`,
      );
      emailSent = false;
    }

    return {
      contract,
      signUrl,
      emailSent,
      documentId,
    };
  }

  async findAll(query?: QueryContractsDto) {
    const where: Prisma.RentalContractWhereInput = {};
    if (query?.status) {
      const normalized = query.status.toUpperCase();
      if (!this.isValidStatus(normalized)) {
        throw new BadRequestException(`Status inválido: ${query.status}`);
      }
      where.status = normalized;
    }
    if (query?.search) {
      const term = query.search.trim();
      if (term.length >= 3) {
        where.OR = [
          { clientName: { contains: term } },
          { clientEmail: { contains: term } },
          { equipment: { contains: term } },
          { token: { contains: term } },
        ];
      } else {
        where.OR = [
          { clientName: { contains: term } },
          { clientEmail: { contains: term } },
          { equipment: { contains: term } },
        ];
      }
    }

    const take = query?.take
      ? Math.min(Math.max(Number(query.take), 1), 100)
      : 50;
    const skip = query?.skip ? Math.max(Number(query.skip), 0) : 0;
    const useCursor = !!query?.cursor;

    const findManyArgs: Prisma.RentalContractFindManyArgs = {
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
        expiresAt: true,
        archivedAt: true,
      },
    };

    if (useCursor) {
      findManyArgs.cursor = { id: Number(query.cursor) };
      findManyArgs.skip = 1;
    } else {
      findManyArgs.skip = skip;
    }

    const items = await this.prisma.rentalContract.findMany(findManyArgs);
    const total = useCursor
      ? null
      : await this.prisma.rentalContract.count({ where });

    const nextCursor =
      items.length === take ? items[items.length - 1].id : null;

    return {
      items,
      total,
      skip: useCursor ? null : skip,
      take,
      nextCursor,
      hasMore: nextCursor !== null,
    };
  }

  async findByToken(token: string): Promise<ContractPublicView> {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        status: true,
        expiresAt: true,
        viewedAt: true,
        clientName: true,
        clientEmail: true,
        clientPhone: true,
        clientAddress: true,
        clientCityStateZip: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        equipment: true,
        groundType: true,
        price: true,
        deposit: true,
        notes: true,
        signedAt: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado o enlace inválido.');
    }

    if (contract.status === 'CANCELLED') {
      throw new BadRequestException('Este contrato fue cancelado.');
    }
    if (contract.status === 'EXPIRED') {
      throw new BadRequestException('Este contrato ha expirado.');
    }

    if (contract.expiresAt && contract.expiresAt.getTime() <= Date.now()) {
      if (contract.status === 'PENDING') {
        await this.markExpired(contract.id);
      }
      throw new BadRequestException('Este enlace de contrato ha expirado.');
    }

    if (contract.status === 'PENDING' && !contract.viewedAt) {
      await this.prisma.rentalContract.updateMany({
        where: { id: contract.id, viewedAt: null },
        data: { viewedAt: new Date() },
      });
    }

    return {
      ...contract,
      checklistItems: CONTRACT_PUBLIC_SAFETY_ITEMS.map((label, i) => ({
        key: PUBLIC_CHECKLIST_KEYS[i],
        label,
      })),
    };
  }

  async signContract(
    token: string,
    dto: SignContractDto,
    meta: SignRequestMeta,
  ): Promise<SignContractResult> {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { token },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado.');
    }

    if (contract.status === 'SIGNED') {
      throw new ConflictException(
        'Este contrato ya fue firmado anteriormente.',
      );
    }
    if (contract.status === 'CANCELLED') {
      throw new BadRequestException('Este contrato fue cancelado.');
    }
    if (contract.status === 'EXPIRED') {
      throw new BadRequestException('Este contrato ha expirado.');
    }

    if (contract.expiresAt && contract.expiresAt.getTime() <= Date.now()) {
      if (contract.status === 'PENDING') {
        await this.markExpired(contract.id);
      }
      throw new BadRequestException('Este enlace de contrato ha expirado.');
    }

    const signatureImage = this.validateSignature(dto.signatureImage);
    const checklist = this.validateChecklist(dto.safetyChecklist);

    const pdfBuffer = await this.pdfService.generatePdf({
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
      signedAt: new Date(),
      signerIp: meta.signerIp || null,
      signerUserAgent: meta.signerUserAgent || null,
      signatureImage,
      safetyChecklist: checklist,
    });

    const client = contract.clientId
      ? await this.clientsService.resolveById(contract.clientId)
      : null;
    const ownerLabel = client
      ? `${client.id}-${this.slugify(client.name)}`
      : 'manual';
    const clientSlug = client ? this.slugify(client.name) : 'manual';

    const saved = await this.storageService.save({
      contractId: contract.id,
      ownerLabel,
      clientSlug,
      kind: 'ELECTRONIC_SIGNED_PDF',
      originalFilename: `Rental_Agreement_Signed_${contract.id}.pdf`,
      buffer: pdfBuffer,
      extension: '.pdf',
    });

    let signedDocumentId: bigint | null = null;
    let updatedContract: { id: number; signedAt: Date | null } | null = null;
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const updateRes = await tx.rentalContract.updateMany({
          where: {
            id: contract.id,
            status: 'PENDING',
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          data: {
            status: 'SIGNED',
            signatureImage,
            safetyChecklist: checklist
              ? (JSON.parse(JSON.stringify(checklist)) as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            signedAt: new Date(),
            signerIp: meta.signerIp || null,
            signerUserAgent: meta.signerUserAgent || null,
            signatureMethod: 'ELECTRONIC',
          },
        });
        if (updateRes.count === 0) {
          throw new ConflictException(
            'Otro proceso modificó el contrato. Recarga e intenta de nuevo.',
          );
        }

        await tx.contractSafetyItem.createMany({
          data: PUBLIC_CHECKLIST_KEYS.map((itemKey) => ({
            contractId: contract.id,
            itemKey,
            isChecked: Boolean(checklist?.[itemKey]),
          })),
          skipDuplicates: true,
        });

        const doc = await tx.contractDocument.create({
          data: {
            contractId: contract.id,
            paymentId: null,
            kind: 'ELECTRONIC_SIGNED_PDF',
            originalFilename: saved.sanitizedFilename,
            mimeType: 'application/pdf',
            sizeBytes: saved.sizeBytes,
            sha256: saved.sha256,
            storagePath: saved.storagePath,
          },
        });

        return doc.id;
      });
      signedDocumentId = result;
      updatedContract = await this.prisma.rentalContract.findUniqueOrThrow({
        where: { id: contract.id },
        select: { id: true, signedAt: true },
      });
    } catch (e) {
      await this.storageService.remove(saved.storagePath);
      this.logger.error(
        `Fallo persistiendo firma/transacción para contrato ${contract.id}: ${(e as Error).message}.`,
      );
      if (e instanceof ConflictException) {
        throw e;
      }
      throw new InternalServerErrorException(
        'No se pudo persistir el PDF firmado. Inténtalo de nuevo.',
      );
    }

    let notifications = { emailSent: false, adminEmailSent: false };
    try {
      notifications = await this.dispatchSignedNotifications(contract.id);
    } catch (e) {
      this.logger.warn(
        `Notificaciones post-firma del contrato ${contract.id} fallaron: ${(e as Error).message}`,
      );
    }

    return {
      id: updatedContract?.id ?? contract.id,
      token: contract.token,
      status: 'SIGNED',
      signedAt: updatedContract?.signedAt ?? new Date(),
      signedDocumentId,
      emailSent: notifications.emailSent,
      adminEmailSent: notifications.adminEmailSent,
    };
  }

  async getPdfBufferByToken(token: string): Promise<Buffer> {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { token },
      select: {
        id: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado.');
    }
    if (contract.status !== 'SIGNED') {
      throw new BadRequestException('El contrato aún no ha sido firmado.');
    }
    if (contract.expiresAt && contract.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('El enlace de descarga ha expirado.');
    }

    const doc = await this.prisma.contractDocument.findFirst({
      where: {
        contractId: contract.id,
        kind: { in: [...SIGNED_KINDS] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!doc) {
      throw new NotFoundException(
        'No existe un PDF firmado almacenado para este contrato.',
      );
    }

    return this.storageService.read(doc.storagePath);
  }

  async findAdminDetail(id: number): Promise<ContractAdminDetail> {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            userId: true,
          },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });
    if (!contract) {
      throw new NotFoundException(`Contrato #${id} no encontrado`);
    }

    const totals = await this.computeTotals(contract.id);

    return {
      ...contract,
      totals,
    };
  }

  async updateContract(id: number, dto: UpdateContractDto) {
    const existing = await this.prisma.rentalContract.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Contrato #${id} no encontrado`);
    }
    if (existing.status === 'SIGNED') {
      throw new BadRequestException('No se puede editar un contrato firmado.');
    }
    if (existing.archivedAt) {
      throw new BadRequestException(
        'No se puede editar un contrato archivado.',
      );
    }

    const data: Prisma.RentalContractUpdateInput = {};

    if (dto.clientName !== undefined) data.clientName = dto.clientName;
    if (dto.clientEmail !== undefined)
      data.clientEmail = dto.clientEmail.toLowerCase();
    if (dto.clientPhone !== undefined)
      data.clientPhone = dto.clientPhone || null;
    if (dto.clientAddress !== undefined) data.clientAddress = dto.clientAddress;
    if (dto.clientCityStateZip !== undefined)
      data.clientCityStateZip = dto.clientCityStateZip || null;
    if (dto.driverLicense !== undefined)
      data.driverLicense = dto.driverLicense || null;
    if (dto.eventDate !== undefined)
      data.eventDate = dto.eventDate ? new Date(dto.eventDate) : null;
    if (dto.startTime !== undefined) data.startTime = dto.startTime || null;
    if (dto.endTime !== undefined) data.endTime = dto.endTime || null;
    if (dto.equipment !== undefined) data.equipment = dto.equipment;
    if (dto.groundType !== undefined) data.groundType = dto.groundType || null;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.deposit !== undefined) data.deposit = dto.deposit;
    if (dto.notes !== undefined) data.notes = dto.notes || null;

    if (Object.keys(data).length === 0) {
      return existing;
    }

    return this.prisma.rentalContract.update({ where: { id }, data });
  }

  async cancelContract(id: number, dto: CancelContractDto) {
    const existing = await this.prisma.rentalContract.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Contrato #${id} no encontrado`);
    }
    if (existing.status === 'CANCELLED') {
      throw new BadRequestException('El contrato ya está cancelado.');
    }
    if (existing.archivedAt) {
      throw new BadRequestException(
        'No se puede cancelar un contrato archivado.',
      );
    }

    return this.prisma.rentalContract.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: dto.reason,
      },
    });
  }

  async archiveContract(id: number) {
    const existing = await this.prisma.rentalContract.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Contrato #${id} no encontrado`);
    }
    if (existing.archivedAt) {
      return existing;
    }
    return this.prisma.rentalContract.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  async resendInvite(id: number) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id },
    });
    if (!contract) {
      throw new NotFoundException(`Contrato #${id} no encontrado`);
    }
    if (!['PENDING', 'EXPIRED'].includes(contract.status)) {
      throw new BadRequestException(
        `Solo se puede reenviar invitación a contratos pendientes o expirados (actual: ${contract.status})`,
      );
    }

    const renewed = await this.prisma.rentalContract.update({
      where: { id: contract.id },
      data: {
        token: crypto.randomBytes(24).toString('hex'),
        status: 'PENDING',
        expiresAt: this.computeExpiry(new Date()),
        viewedAt: null,
      },
    });

    const webBaseUrl =
      process.env.PUBLIC_WEB_URL ||
      process.env.SITE_URL ||
      'http://localhost:3000';
    const signUrl = `${webBaseUrl}/contrato/firmar/${renewed.token}`;

    const { subject, html } = this.emailService.getContractInviteEmailTemplate({
      clientName: renewed.clientName,
      equipment: renewed.equipment,
      signUrl,
      eventDate: renewed.eventDate
        ? new Date(renewed.eventDate).toLocaleDateString()
        : null,
    });

    const sent = await this.emailService.send({
      to: renewed.clientEmail,
      subject,
      html,
    });

    return { emailSent: sent, signUrl };
  }

  async resendSigned(id: number) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id },
    });
    if (!contract) {
      throw new NotFoundException(`Contrato #${id} no encontrado`);
    }
    if (contract.status !== 'SIGNED' || !contract.signedAt) {
      throw new BadRequestException('El contrato aún no ha sido firmado.');
    }

    const doc = await this.prisma.contractDocument.findFirst({
      where: { contractId: id, kind: { in: [...SIGNED_KINDS] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!doc) {
      throw new NotFoundException(
        'No existe un PDF firmado almacenado para este contrato.',
      );
    }

    const pdfBuffer = await this.storageService.read(doc.storagePath);

    const { subject, html } = this.emailService.getContractSignedEmailTemplate({
      clientName: contract.clientName,
      equipment: contract.equipment,
    });

    const sent = await this.emailService.send({
      to: contract.clientEmail,
      subject,
      html,
      attachments: [
        {
          filename: `Rental_Agreement_${contract.clientName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return { emailSent: sent };
  }

  async uploadDocument(
    contractId: number,
    file: Express.Multer.File | undefined,
    dto: UploadContractDocumentDto,
    actorUserId: number | null,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Archivo vacío');
    }

    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: { client: true },
    });
    if (!contract) {
      throw new NotFoundException(`Contrato #${contractId} no encontrado`);
    }

    const kind = dto.kind.toUpperCase();
    const detectedMime = detectMimeFromBuffer(file.buffer);
    if (detectedMime === 'unknown') {
      throw new BadRequestException(
        'Tipo de archivo no soportado. Solo PDF, PNG o JPEG.',
      );
    }
    if (kind === 'UPLOADED_SIGNED_PDF' && detectedMime !== 'application/pdf') {
      throw new BadRequestException(
        'El archivo firmado debe ser un PDF válido.',
      );
    }
    if (
      (kind === 'PAYMENT_RECEIPT' || kind === 'OTHER') &&
      !(
        detectedMime === 'application/pdf' ||
        detectedMime === 'image/png' ||
        detectedMime === 'image/jpeg'
      )
    ) {
      throw new BadRequestException(
        'Tipo de archivo no soportado. Solo PDF, PNG o JPEG.',
      );
    }
    const mimeType = detectedMime;
    const extension = extensionForMime(mimeType) ?? undefined;

    if (kind === 'UPLOADED_SIGNED_PDF') {
      if (contract.status === 'CANCELLED' || contract.archivedAt) {
        throw new BadRequestException(
          'No se puede firmar un contrato cancelado/archivado.',
        );
      }
    } else if (kind === 'PAYMENT_RECEIPT') {
      if (!dto.paymentId) {
        throw new BadRequestException(
          'paymentId es obligatorio para PAYMENT_RECEIPT',
        );
      }
      const payment = await this.prisma.contractPayment.findUnique({
        where: { id: BigInt(dto.paymentId) },
      });
      if (!payment || payment.contractId !== contractId) {
        throw new BadRequestException(
          `Pago #${dto.paymentId} no pertenece al contrato ${contractId}`,
        );
      }
    } else if (kind !== 'OTHER') {
      throw new BadRequestException(`kind no soportado: ${kind}`);
    }

    const client = contract.client;
    const ownerLabel = client
      ? `${client.id}-${this.slugify(client.name)}`
      : 'manual';
    const clientSlug = client ? this.slugify(client.name) : 'manual';

    const saved = await this.storageService.save({
      contractId: contract.id,
      ownerLabel,
      clientSlug,
      kind,
      originalFilename: file.originalname,
      buffer: file.buffer,
      mimeType,
      extension,
    });

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const doc = await tx.contractDocument.create({
          data: {
            contractId: contract.id,
            paymentId: dto.paymentId ? BigInt(dto.paymentId) : null,
            kind,
            originalFilename: saved.sanitizedFilename,
            mimeType,
            sizeBytes: saved.sizeBytes,
            sha256: saved.sha256,
            storagePath: saved.storagePath,
            uploadedById: actorUserId,
          },
        });

        if (kind === 'UPLOADED_SIGNED_PDF') {
          const signedAt = dto.signedAt ? new Date(dto.signedAt) : new Date();
          await tx.rentalContract.update({
            where: { id: contract.id },
            data: {
              status: 'SIGNED',
              signedAt,
              signatureMethod: 'UPLOADED',
            },
          });
        }

        return doc;
      });

      let notifications = { emailSent: false, adminEmailSent: false };
      if (kind === 'UPLOADED_SIGNED_PDF') {
        try {
          notifications = await this.dispatchSignedNotifications(contract.id);
        } catch (e) {
          this.logger.warn(
            `Notificaciones del contrato subido ${contract.id} fallaron: ${(e as Error).message}`,
          );
        }
      }

      return {
        id: result.id,
        contractId: result.contractId,
        kind: result.kind,
        originalFilename: result.originalFilename,
        mimeType: result.mimeType,
        sizeBytes: result.sizeBytes,
        sha256: result.sha256,
        createdAt: result.createdAt,
        ...notifications,
      };
    } catch (e) {
      await this.storageService.remove(saved.storagePath);
      throw e;
    }
  }

  async downloadDocument(contractId: number, documentId: bigint | number) {
    const doc = await this.prisma.contractDocument.findUnique({
      where: {
        id: typeof documentId === 'bigint' ? documentId : BigInt(documentId),
      },
    });
    if (!doc || doc.contractId !== contractId) {
      throw new NotFoundException(
        `Documento ${documentId} no pertenece al contrato ${contractId}`,
      );
    }
    const buffer = await this.storageService.read(doc.storagePath);
    return {
      buffer,
      filename: doc.originalFilename,
      mimeType: doc.mimeType,
    };
  }

  async deleteDocument(
    contractId: number,
    documentId: bigint | number,
    reason: string,
    actorUserId: number | null,
  ) {
    const doc = await this.prisma.contractDocument.findUnique({
      where: {
        id: typeof documentId === 'bigint' ? documentId : BigInt(documentId),
      },
    });
    if (!doc || doc.contractId !== contractId) {
      throw new NotFoundException(
        `Documento ${documentId} no pertenece al contrato ${contractId}`,
      );
    }

    if (
      doc.kind === 'ELECTRONIC_SIGNED_PDF' ||
      doc.kind === 'UPLOADED_SIGNED_PDF'
    ) {
      const signedDocuments = await this.prisma.contractDocument.count({
        where: {
          contractId,
          kind: { in: [...SIGNED_KINDS] },
        },
      });
      if (signedDocuments <= 1) {
        throw new BadRequestException(
          'No se puede eliminar la única copia firmada. Elimina el expediente completo si existe una solicitud del cliente.',
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.contractDocument.delete({ where: { id: doc.id } }),
      this.prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'DELETE',
          entity: 'ContractDocument',
          entityId: String(doc.id),
          metadata: {
            contractId,
            kind: doc.kind,
            reason,
          },
        },
      }),
    ]);

    await this.storageService.remove(doc.storagePath);

    return { deleted: true, id: doc.id };
  }

  async addPayment(
    contractId: number,
    dto: CreateContractPaymentDto,
    actorUserId: number | null,
  ) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException(`Contrato #${contractId} no encontrado`);
    }
    if (contract.archivedAt) {
      throw new BadRequestException(
        'No se pueden agregar pagos a un contrato archivado.',
      );
    }
    const type = dto.type.toUpperCase();
    if (!['DEPOSIT', 'PAYMENT', 'REFUND'].includes(type)) {
      throw new BadRequestException(`Tipo de pago inválido: ${dto.type}`);
    }

    const payment = await this.prisma.contractPayment.create({
      data: {
        contractId,
        type,
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference || null,
        notes: dto.notes || null,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        createdById: actorUserId,
      },
    });

    const totals = await this.computeTotals(contractId);
    return { payment, totals };
  }

  async deletePayment(
    contractId: number,
    paymentId: bigint | number,
    reason: string,
    actorUserId: number | null,
  ) {
    const payment = await this.prisma.contractPayment.findUnique({
      where: {
        id: typeof paymentId === 'bigint' ? paymentId : BigInt(paymentId),
      },
    });
    if (!payment || payment.contractId !== contractId) {
      throw new NotFoundException(
        `Pago ${paymentId} no pertenece al contrato ${contractId}`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.contractPayment.delete({ where: { id: payment.id } }),
      this.prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'DELETE',
          entity: 'ContractPayment',
          entityId: String(payment.id),
          metadata: {
            contractId,
            type: payment.type,
            amount: Number(payment.amount),
            reason,
          },
        },
      }),
    ]);

    const totals = await this.computeTotals(contractId);
    return { deleted: true, id: payment.id, totals };
  }

  async computeTotals(contractId: number): Promise<{
    totalPaid: number;
    balanceDue: number;
    price: number;
    deposit: number;
  }> {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id: contractId },
      select: { price: true, deposit: true },
    });
    if (!contract) {
      throw new NotFoundException(`Contrato #${contractId} no encontrado`);
    }

    const sums = await this.prisma.contractPayment.groupBy({
      by: ['type'],
      where: { contractId },
      _sum: { amount: true },
    });

    let totalDeposits = 0;
    let totalPayments = 0;
    let totalRefunds = 0;
    for (const row of sums) {
      const value = row._sum.amount ? Number(row._sum.amount) : 0;
      if (row.type === 'DEPOSIT') totalDeposits = value;
      else if (row.type === 'PAYMENT') totalPayments = value;
      else if (row.type === 'REFUND') totalRefunds = value;
    }
    const totalPaid = Math.max(0, totalDeposits + totalPayments - totalRefunds);
    const price = contract.price ? Number(contract.price) : 0;
    const deposit = contract.deposit ? Number(contract.deposit) : 0;
    const balanceDue = Math.max(0, price - totalPaid);

    return { totalPaid, balanceDue, price, deposit };
  }

  async hardDeleteContract(
    id: number,
    reason: string,
    actorUserId: number | null,
  ) {
    const contract = await this.prisma.rentalContract.findUnique({
      where: { id },
      include: {
        documents: { select: { id: true, storagePath: true, kind: true } },
        payments: { select: { id: true, type: true, amount: true } },
      },
    });
    if (!contract) {
      throw new NotFoundException(`Contrato #${id} no encontrado`);
    }

    const snapshot = {
      id: contract.id,
      token: contract.token,
      clientName: contract.clientName,
      clientEmail: contract.clientEmail,
      status: contract.status,
      signedAt: contract.signedAt,
      documents: contract.documents.map((d) => ({
        id: String(d.id),
        kind: d.kind,
        path: d.storagePath,
      })),
      payments: contract.payments.map((p) => ({
        id: String(p.id),
        type: p.type,
        amount: Number(p.amount),
      })),
      reason,
    };

    await this.prisma.$transaction([
      this.prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'HARD_DELETE',
          entity: 'RentalContract',
          entityId: String(contract.id),
          metadata: snapshot,
        },
      }),
      this.prisma.rentalContract.delete({ where: { id: contract.id } }),
    ]);

    const orphans: string[] = [];
    for (const doc of contract.documents) {
      const ok = await this.storageService.remove(doc.storagePath);
      if (!ok) {
        orphans.push(doc.storagePath);
      }
    }

    if (orphans.length > 0) {
      try {
        await this.prisma.auditLog.create({
          data: {
            userId: actorUserId,
            action: 'STORAGE_CLEANUP_ORPHAN',
            entity: 'RentalContract',
            entityId: String(contract.id),
            metadata: {
              reason: 'storage-cleanup-failed',
              orphans,
            },
          },
        });
      } catch (e) {
        this.logger.warn(
          `No se pudo registrar AuditLog de huérfanos para contrato ${contract.id}: ${(e as Error).message}`,
        );
      }
    }

    return { deleted: true, id: contract.id, fsOrphans: orphans };
  }

  private async markExpired(id: number) {
    try {
      await this.prisma.rentalContract.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });
    } catch (e) {
      this.logger.warn(
        `No se pudo marcar contrato ${id} como EXPIRED: ${(e as Error).message}`,
      );
    }
  }

  private async cleanupContractArtifacts(contractId: number): Promise<void> {
    try {
      const docs = await this.prisma.contractDocument.findMany({
        where: { contractId },
        select: { storagePath: true },
      });
      for (const doc of docs) {
        await this.storageService.remove(doc.storagePath);
      }
      await this.prisma.rentalContract.delete({ where: { id: contractId } });
    } catch (e) {
      this.logger.error(
        `Cleanup falló para contrato ${contractId}: ${(e as Error).message}`,
      );
    }
  }

  private computeExpiry(from: Date): Date {
    const exp = new Date(from);
    exp.setDate(exp.getDate() + CONTRACT_TOKEN_TTL_DAYS);
    return exp;
  }

  private isValidStatus(status: string): boolean {
    return ['PENDING', 'SIGNED', 'EXPIRED', 'CANCELLED'].includes(
      status.toUpperCase(),
    );
  }

  private validateSignature(raw: string): string {
    if (typeof raw !== 'string') {
      throw new BadRequestException('La firma debe ser una cadena base64.');
    }
    const trimmed = raw.trim();
    if (!trimmed.startsWith(SIGNATURE_BASE64_PREFIX)) {
      throw new BadRequestException(
        'La firma debe ser un data URL PNG en base64.',
      );
    }
    const base64 = trimmed.slice(SIGNATURE_BASE64_PREFIX.length);
    if (!base64) {
      throw new BadRequestException('La firma está vacía.');
    }
    if (!/^[A-Za-z0-9+/=_-]+$/.test(base64)) {
      throw new BadRequestException('La firma contiene caracteres no válidos.');
    }
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length === 0) {
      throw new BadRequestException('La firma decodificada está vacía.');
    }
    if (buffer.length < SIGNATURE_MIN_BYTES) {
      throw new BadRequestException('La firma es demasiado pequeña.');
    }
    if (buffer.length > SIGNATURE_MAX_BYTES) {
      throw new BadRequestException(
        'La firma excede el tamaño permitido (2MB).',
      );
    }
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    if (!isPng) {
      throw new BadRequestException('La firma debe ser una imagen PNG.');
    }
    return trimmed;
  }

  private validateChecklist(
    input?: Record<string, boolean>,
  ): Record<string, boolean> | null {
    const normalized: Record<string, boolean> = {};
    for (const key of PUBLIC_CHECKLIST_KEYS) {
      const value = input?.[key];
      normalized[key] = Boolean(value);
    }
    for (const k of Object.keys(normalized)) {
      if (!normalized[k]) {
        throw new BadRequestException(
          `Todos los puntos del checklist son obligatorios (faltante: ${k}).`,
        );
      }
    }
    return normalized;
  }

  private slugify(value: string): string {
    return value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  private async dispatchSignedNotifications(
    contractId: number,
  ): Promise<{ emailSent: boolean; adminEmailSent: boolean }> {
    const contract = await this.prisma.rentalContract.findUniqueOrThrow({
      where: { id: contractId },
    });
    const doc = await this.prisma.contractDocument.findFirst({
      where: { contractId, kind: { in: [...SIGNED_KINDS] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!doc) {
      return { emailSent: false, adminEmailSent: false };
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await this.storageService.read(doc.storagePath);
    } catch (e) {
      this.logger.warn(
        `No se pudo leer PDF firmado para email (contrato ${contractId}): ${(e as Error).message}`,
      );
      return { emailSent: false, adminEmailSent: false };
    }

    const { subject, html } = this.emailService.getContractSignedEmailTemplate({
      clientName: contract.clientName,
      equipment: contract.equipment,
    });

    let emailSent = false;
    try {
      emailSent = await this.emailService.send({
        to: contract.clientEmail,
        subject,
        html,
        attachments: [
          {
            filename: `Rental_Agreement_${contract.clientName.replace(/\s+/g, '_')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    } catch (e) {
      this.logger.warn(
        `Email cliente post-firma falló (contrato ${contractId}): ${(e as Error).message}`,
      );
    }

    let adminEmailSent = false;
    const adminNotifyEmail =
      process.env.ADMIN_NOTIFY_EMAIL ||
      process.env.SMTP_FROM ||
      'info@kidsfunyfiestasinfantiles.com';
    try {
      adminEmailSent = await this.emailService.send({
        to: adminNotifyEmail,
        subject: `[ADMIN COPY] Signed Contract: ${contract.clientName}`,
        html: `<p>Se ha firmado un nuevo contrato de alquiler para <strong>${contract.clientName}</strong> (${contract.equipment}). Se adjunta la copia firmada en PDF.</p>`,
        attachments: [
          {
            filename: `Rental_Agreement_${contract.clientName.replace(/\s+/g, '_')}_ADMIN.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
    } catch (e) {
      this.logger.warn(
        `Email admin post-firma falló (contrato ${contractId}): ${(e as Error).message}`,
      );
    }

    return { emailSent, adminEmailSent };
  }
}
