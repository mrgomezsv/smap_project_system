import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ContractsService } from './contracts.service';
import { ContractPdfService } from './services/contract-pdf.service';
import { ContractStorageService } from './services/contract-storage.service';
import { ClientsService } from '../clients/clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../waivers/services/email.service';
import {
  CONTRACT_PUBLIC_SAFETY_ITEMS,
  PUBLIC_CHECKLIST_KEYS,
  SIGNATURE_BASE64_PREFIX,
} from './contracts.service';

import * as crypto from 'crypto';

const ONE_PNG_BASE64 = (() => {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const payload = Buffer.alloc(400, 0x01);
  return Buffer.concat([header, payload]).toString('base64');
})();

const fakeSignatureImage = `${SIGNATURE_BASE64_PREFIX}${ONE_PNG_BASE64}`;
const fakePdfBuffer = Buffer.from('%PDF-1.4 hello world from pdf service');

function buildValidChecklist(overrides: Record<string, boolean> = {}) {
  const base: Record<string, boolean> = {};
  for (const key of PUBLIC_CHECKLIST_KEYS) {
    base[key] = true;
  }
  return { ...base, ...overrides };
}

describe('ContractsService', () => {
  let service: ContractsService;

  const mockPrisma = {
    rentalContract: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    contractSafetyItem: {
      createMany: jest.fn(),
    },
    contractDocument: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    contractPayment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    client: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPdf = {
    generatePdf: jest.fn().mockResolvedValue(fakePdfBuffer),
  };
  const mockStorage = {
    save: jest.fn(),
    read: jest.fn(),
    remove: jest.fn(),
    getRootDir: jest.fn().mockReturnValue('/tmp/contracts'),
    getMaxBytes: jest.fn().mockReturnValue(10 * 1024 * 1024),
    resolveInsideRoot: jest.fn(),
  };
  const mockClients = {
    resolveForContract: jest.fn(),
    resolveById: jest.fn(),
  };
  const mockEmail = {
    send: jest.fn().mockResolvedValue(true),
    getContractInviteEmailTemplate: jest
      .fn()
      .mockReturnValue({ subject: 's', html: '<p>x</p>' }),
    getContractSignedEmailTemplate: jest
      .fn()
      .mockReturnValue({ subject: 's2', html: '<p>y</p>' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.rentalContract.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: 100,
          token: data.token,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    );
    mockPrisma.contractDocument.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: 1n,
          contractId: data.contractId,
          paymentId: data.paymentId,
          kind: data.kind,
          originalFilename: data.originalFilename,
          mimeType: data.mimeType,
          sizeBytes: data.sizeBytes,
          sha256: data.sha256,
          storagePath: data.storagePath,
          uploadedById: data.uploadedById,
          createdAt: new Date(),
        }),
    );
    mockPrisma.contractPayment.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: 7n,
          contractId: data.contractId,
          type: data.type,
          amount: data.amount,
          method: data.method,
          reference: data.reference ?? null,
          notes: data.notes ?? null,
          paidAt: data.paidAt,
          createdById: data.createdById ?? null,
          createdAt: new Date(),
        }),
    );
    mockStorage.save.mockImplementation(
      ({ buffer, kind }: { buffer?: Buffer; kind: string }) =>
        Promise.resolve({
          storagePath: `contracts/${kind.toLowerCase()}.pdf`,
          absolutePath: `/tmp/contracts/${kind.toLowerCase()}.pdf`,
          sha256: crypto
            .createHash('sha256')
            .update(buffer ?? Buffer.alloc(0))
            .digest('hex'),
          sizeBytes: (buffer ?? Buffer.alloc(0)).length,
          sanitizedFilename: `${kind.toLowerCase()}.pdf`,
        }),
    );
    mockStorage.read.mockResolvedValue(fakePdfBuffer);
    mockPrisma.contractDocument.findFirst.mockResolvedValue({
      id: 9n,
      contractId: 1,
      kind: 'ELECTRONIC_SIGNED_PDF',
      storagePath: 'signed/foo.pdf',
      originalFilename: 'foo.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 11,
      sha256: 'abc',
      uploadedById: null,
      paymentId: null,
      createdAt: new Date(),
    });
    mockPrisma.contractPayment.groupBy.mockResolvedValue([]);
    mockPrisma.rentalContract.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.rentalContract.update.mockImplementation(
      ({
        where,
        data,
      }: {
        where: { id: number };
        data: Record<string, unknown>;
      }) =>
        Promise.resolve({
          id: where.id,
          ...data,
        }),
    );
    mockPrisma.rentalContract.findUniqueOrThrow.mockImplementation(
      ({ where }: { where: { id: number } }) =>
        Promise.resolve({
          id: where.id,
          token: 'token-abc',
          clientName: 'Cliente Test',
          clientEmail: 'cliente@test.com',
          clientPhone: null,
          clientAddress: '123 Main St',
          clientCityStateZip: null,
          driverLicense: null,
          eventDate: null,
          startTime: null,
          endTime: null,
          equipment: 'Bouncer',
          groundType: null,
          price: new Prisma.Decimal(100),
          deposit: new Prisma.Decimal(50),
          notes: null,
          status: 'SIGNED',
          safetyChecklist: null,
          signatureImage: fakeSignatureImage,
          signedAt: new Date(),
          signerIp: '127.0.0.1',
          signerUserAgent: 'jest',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
          viewedAt: null,
          archivedAt: null,
          cancelledAt: null,
          cancelReason: null,
          signatureMethod: 'ELECTRONIC',
          createdById: null,
          clientId: 1,
        }),
    );
    mockPrisma.rentalContract.findUnique.mockImplementation(
      ({
        where,
        select,
      }: {
        where?: { token?: string };
        select?: Record<string, boolean>;
      }) => {
        if (where?.token) {
          const full = {
            id: 1,
            token: where.token,
            clientName: 'Cliente Test',
            clientEmail: 'cliente@test.com',
            clientPhone: null,
            clientAddress: '123 Main St',
            clientCityStateZip: null,
            driverLicense: null,
            eventDate: null,
            startTime: null,
            endTime: null,
            equipment: 'Bouncer',
            groundType: null,
            price: new Prisma.Decimal(100),
            deposit: new Prisma.Decimal(50),
            notes: null,
            status: 'PENDING',
            safetyChecklist: null,
            signatureImage: null,
            signedAt: null,
            signerIp: null,
            signerUserAgent: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + 86400000),
            viewedAt: null,
            archivedAt: null,
            cancelledAt: null,
            cancelReason: null,
            signatureMethod: null,
            createdById: null,
            clientId: 1,
          };
          if (select) {
            const out: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if ((select as Record<string, unknown>)[key]) {
                out[key] = full[key as keyof typeof full];
              }
            }
            return Promise.resolve(out);
          }
          return Promise.resolve(full);
        }
        return Promise.resolve(null);
      },
    );
    mockPrisma.contractSafetyItem.createMany.mockResolvedValue({ count: 0 });
    mockPrisma.$transaction.mockImplementation((arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: typeof mockPrisma) => unknown)(mockPrisma);
      }
      if (Array.isArray(arg)) return Promise.all(arg);
      return Promise.resolve(arg);
    });
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockPrisma.rentalContract.delete.mockResolvedValue({ id: 1 });
    mockPrisma.contractPayment.findUnique.mockImplementation(
      ({ where }: { where: { id: bigint } }) =>
        Promise.resolve({
          id: where.id,
          contractId: 1,
          type: 'DEPOSIT',
          amount: new Prisma.Decimal(50),
          method: 'manual',
          reference: null,
          notes: null,
          paidAt: new Date(),
          createdById: null,
          createdAt: new Date(),
        }),
    );
    mockClients.resolveForContract.mockImplementation(
      ({ clientId }: { clientId?: number }) =>
        Promise.resolve({
          id: clientId ?? 1,
          email: 'cliente@test.com',
          name: 'Cliente Test',
        }),
    );
    mockClients.resolveById.mockImplementation((id: number) =>
      Promise.resolve({
        id,
        email: 'cliente@test.com',
        name: 'Cliente Test',
      }),
    );

    const module = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ContractPdfService, useValue: mockPdf },
        { provide: ContractStorageService, useValue: mockStorage },
        { provide: ClientsService, useValue: mockClients },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();
    service = module.get(ContractsService);
  });

  describe('createContract', () => {
    it('genera token, asigna expiresAt 7 días, crea pago DEPOSIT si deposit>0 y emite documento', async () => {
      const result = await service.createContract(
        {
          clientName: 'Ana',
          clientEmail: 'ANA@test.com',
          clientAddress: '123 Main St',
          equipment: 'Bouncer',
          deposit: 50,
          price: 100,
        },
        7,
      );

      expect(result.contract.token).toHaveLength(48);
      expect(result.contract.expiresAt).toBeInstanceOf(Date);
      const expiresAt = result.contract.expiresAt as Date;
      const createdAt = result.contract.createdAt;
      const diffDays =
        (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6.99);
      expect(diffDays).toBeLessThan(7.01);

      const resolveCalls = mockClients.resolveForContract.mock
        .calls as unknown[][];
      const resolveArgs = resolveCalls[0]?.[0];
      expect(resolveArgs).toMatchObject({
        email: 'ANA@test.com',
        name: 'Ana',
      });
      const paymentCalls = mockPrisma.contractPayment.create.mock
        .calls as unknown[][];
      const paymentArgs = paymentCalls[0]?.[0];
      expect(paymentArgs).toMatchObject({
        data: {
          type: 'DEPOSIT',
          amount: 50,
          contractId: 100,
        },
      });
      expect(mockStorage.save).toHaveBeenCalled();
      const docCalls = mockPrisma.contractDocument.create.mock
        .calls as unknown[][];
      const docArgs = docCalls[0]?.[0];
      expect(docArgs).toMatchObject({
        data: {
          contractId: 100,
          kind: 'ISSUED_PDF',
        },
      });
      expect(result.emailSent).toBe(true);
    });

    it('no crea pago DEPOSIT si deposit no es positivo', async () => {
      await service.createContract(
        {
          clientName: 'Ana',
          clientEmail: 'a@b.com',
          clientAddress: 'x',
          equipment: 'Bouncer',
        },
        7,
      );
      expect(mockPrisma.contractPayment.create).not.toHaveBeenCalled();
    });

    it('devuelve emailSent=false si el envío falla y registra log', async () => {
      mockEmail.send.mockResolvedValueOnce(false);
      const result = await service.createContract(
        {
          clientName: 'Ana',
          clientEmail: 'a@b.com',
          clientAddress: 'x',
          equipment: 'Bouncer',
        },
        7,
      );
      expect(result.emailSent).toBe(false);
    });
  });

  describe('findByToken', () => {
    it('devuelve DTO público seguro, sin driverLicense/signerIp/signatureImage', async () => {
      const view = (await service.findByToken(
        'token-abc',
      )) as unknown as Record<string, unknown> & {
        checklistItems: { key: string }[];
      };
      expect(view).not.toHaveProperty('driverLicense');
      expect(view).not.toHaveProperty('signatureImage');
      expect(view).not.toHaveProperty('signerIp');
      expect(view).not.toHaveProperty('signerUserAgent');
      expect(view.checklistItems).toHaveLength(
        CONTRACT_PUBLIC_SAFETY_ITEMS.length,
      );
      expect(view.checklistItems[0]?.key).toBe(PUBLIC_CHECKLIST_KEYS[0]);
    });

    it('rechaza CANCELLED', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        ...(await mockPrisma.rentalContract.findUnique({
          where: { token: 'x' },
        })),
        status: 'CANCELLED',
      });
      await expect(service.findByToken('x')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rechaza EXPIRED', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        ...(await mockPrisma.rentalContract.findUnique({
          where: { token: 'x' },
        })),
        status: 'EXPIRED',
      });
      await expect(service.findByToken('x')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('marca EXPIRED si PENDING vencido y rechaza', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        token: 'tok',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 1000),
        viewedAt: null,
        clientName: 'a',
        clientEmail: 'a@b.com',
        clientPhone: null,
        clientAddress: 'x',
        clientCityStateZip: null,
        eventDate: null,
        startTime: null,
        endTime: null,
        equipment: 'b',
        groundType: null,
        price: null,
        deposit: null,
        notes: null,
        signedAt: null,
      });
      await expect(service.findByToken('tok')).rejects.toThrow(
        BadRequestException,
      );
      const updateManyCalls = mockPrisma.rentalContract.updateMany.mock
        .calls as unknown[][];
      const updateManyArgs = updateManyCalls[0]?.[0];
      expect(updateManyArgs).toMatchObject({
        where: {
          id: 1,
          status: 'PENDING',
        },
        data: { status: 'EXPIRED' },
      });
    });

    it('registra viewedAt la primera vez', async () => {
      await service.findByToken('token-abc');
      const updateManyCalls = mockPrisma.rentalContract.updateMany.mock
        .calls as unknown[][];
      const updateManyArgs = updateManyCalls[0]?.[0] as {
        where?: Record<string, unknown>;
        data?: Record<string, unknown>;
      };
      expect(updateManyArgs.where).toMatchObject({ id: 1, viewedAt: null });
      expect(updateManyArgs.data?.viewedAt).toBeInstanceOf(Date);
    });
  });

  describe('signContract', () => {
    const meta = { signerIp: '1.1.1.1', signerUserAgent: 'jest' };

    it('firma: valida PNG, exige los 9 checklist, guarda PDF firmado y documento', async () => {
      const result = (await service.signContract(
        'token-abc',
        {
          signatureImage: fakeSignatureImage,
          safetyChecklist: buildValidChecklist(),
        },
        meta,
      )) as unknown as {
        status: string;
        signedDocumentId: bigint;
        emailSent: boolean;
      };

      const updateManyCalls = mockPrisma.rentalContract.updateMany.mock
        .calls as unknown[][];
      const updateManyArgs = updateManyCalls[0]?.[0];
      expect(updateManyArgs).toMatchObject({
        where: { id: 1, status: 'PENDING' },
        data: { status: 'SIGNED', signatureMethod: 'ELECTRONIC' },
      });
      const saveCalls = mockStorage.save.mock.calls as unknown[][];
      const saveArgs = saveCalls[0]?.[0];
      expect(saveArgs).toMatchObject({ kind: 'ELECTRONIC_SIGNED_PDF' });
      expect(result.status).toBe('SIGNED');
      expect(result.signedDocumentId).toEqual(1n);
      expect(result.emailSent).toBe(true);
    });

    it('rechaza firma sin prefijo PNG', async () => {
      await expect(
        service.signContract(
          'token-abc',
          {
            signatureImage: 'data:image/jpeg;base64,xxx',
            safetyChecklist: buildValidChecklist(),
          },
          meta,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza firma demasiado pequeña', async () => {
      const tiny = `${SIGNATURE_BASE64_PREFIX}${Buffer.from([1, 2, 3]).toString('base64')}`;
      await expect(
        service.signContract(
          'token-abc',
          {
            signatureImage: tiny,
            safetyChecklist: buildValidChecklist(),
          },
          meta,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si falta algún check del checklist', async () => {
      await expect(
        service.signContract(
          'token-abc',
          {
            signatureImage: fakeSignatureImage,
            safetyChecklist: buildValidChecklist({ check_3: false }),
          },
          meta,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('evita doble firma con updateMany condicional (count=0 -> 409)', async () => {
      mockPrisma.rentalContract.updateMany.mockResolvedValueOnce({ count: 0 });
      await expect(
        service.signContract(
          'token-abc',
          {
            signatureImage: fakeSignatureImage,
            safetyChecklist: buildValidChecklist(),
          },
          meta,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('limpia el archivo si la transacción falla (no SIGNED sin documento)', async () => {
      mockPrisma.$transaction.mockRejectedValueOnce(
        new Error('tx rolled back'),
      );
      await expect(
        service.signContract(
          'token-abc',
          {
            signatureImage: fakeSignatureImage,
            safetyChecklist: buildValidChecklist(),
          },
          meta,
        ),
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockStorage.remove).toHaveBeenCalled();
    });

    it('rechaza si el contrato ya está firmado', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        ...(await mockPrisma.rentalContract.findUnique({
          where: { token: 'x' },
        })),
        status: 'SIGNED',
      });
      await expect(
        service.signContract(
          'token-abc',
          {
            signatureImage: fakeSignatureImage,
            safetyChecklist: buildValidChecklist(),
          },
          meta,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza CANCELLED y EXPIRED', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        ...(await mockPrisma.rentalContract.findUnique({
          where: { token: 'x' },
        })),
        status: 'CANCELLED',
      });
      await expect(
        service.signContract(
          'token-abc',
          {
            signatureImage: fakeSignatureImage,
            safetyChecklist: buildValidChecklist(),
          },
          meta,
        ),
      ).rejects.toThrow(BadRequestException);

      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        ...(await mockPrisma.rentalContract.findUnique({
          where: { token: 'x' },
        })),
        status: 'EXPIRED',
      });
      await expect(
        service.signContract(
          'token-abc',
          {
            signatureImage: fakeSignatureImage,
            safetyChecklist: buildValidChecklist(),
          },
          meta,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPdfBufferByToken', () => {
    it('lee snapshot almacenado del PDF firmado, no regenera', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        token: 'tok',
        status: 'SIGNED',
        expiresAt: new Date(Date.now() + 86400000),
      });

      const buf = await service.getPdfBufferByToken('tok');
      expect(mockPdf.generatePdf).not.toHaveBeenCalled();
      expect(mockStorage.read).toHaveBeenCalledWith('signed/foo.pdf');
      expect(buf.equals(fakePdfBuffer)).toBe(true);
    });

    it('rechaza si status != SIGNED', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        token: 'tok',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
      });
      await expect(service.getPdfBufferByToken('tok')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rechaza si token expirado', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        token: 'tok',
        status: 'SIGNED',
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.getPdfBufferByToken('tok')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadDocument', () => {
    const fakeFile = (kind: 'pdf' | 'png' | 'jpg') => {
      const head =
        kind === 'pdf'
          ? Buffer.from('%PDF-')
          : kind === 'png'
            ? Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
            : Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      return {
        buffer: Buffer.concat([
          head,
          Buffer.from('rest of body content padded to make size valid'),
        ]),
        originalname: `file.${kind}`,
        mimetype:
          kind === 'pdf'
            ? 'application/pdf'
            : kind === 'png'
              ? 'image/png'
              : 'image/jpeg',
        size: 1,
      } as unknown as Express.Multer.File;
    };

    it('sube UPLOADED_SIGNED_PDF, marca SIGNED y preserva documento emitido', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        clientId: 1,
        status: 'PENDING',
        archivedAt: null,
        documents: [],
        client: { id: 1, name: 'Cliente', email: 'a@b.com' },
      });

      const result = await service.uploadDocument(
        1,
        fakeFile('pdf'),
        { kind: 'UPLOADED_SIGNED_PDF' },
        5,
      );

      expect(result.kind).toBe('UPLOADED_SIGNED_PDF');
      const updateCalls = mockPrisma.rentalContract.update.mock
        .calls as unknown[][];
      const updateArgs = updateCalls[0]?.[0];
      expect(updateArgs).toMatchObject({
        where: { id: 1 },
        data: {
          status: 'SIGNED',
          signatureMethod: 'UPLOADED',
        },
      });
    });

    it('rechaza PAYMENT_RECEIPT sin paymentId', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        clientId: 1,
        status: 'PENDING',
        archivedAt: null,
        documents: [],
        client: { id: 1, name: 'Cliente', email: 'a@b.com' },
      });
      await expect(
        service.uploadDocument(
          1,
          fakeFile('pdf'),
          { kind: 'PAYMENT_RECEIPT' },
          5,
        ),
      ).rejects.toThrow(/paymentId/);
    });

    it('rechaza archivo con magic bytes inválidos para UPLOADED_SIGNED_PDF', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        clientId: 1,
        status: 'PENDING',
        archivedAt: null,
        documents: [],
        client: { id: 1, name: 'Cliente', email: 'a@b.com' },
      });
      await expect(
        service.uploadDocument(
          1,
          fakeFile('png'),
          { kind: 'UPLOADED_SIGNED_PDF' },
          5,
        ),
      ).rejects.toThrow(/PDF/);
    });
  });

  describe('computeTotals', () => {
    it('calcula totalPaid y balanceDue a partir de pagos', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        price: new Prisma.Decimal(100),
        deposit: new Prisma.Decimal(50),
      });
      mockPrisma.contractPayment.groupBy.mockResolvedValueOnce([
        { type: 'DEPOSIT', _sum: { amount: new Prisma.Decimal(50) } },
        { type: 'PAYMENT', _sum: { amount: new Prisma.Decimal(50) } },
        { type: 'REFUND', _sum: { amount: new Prisma.Decimal(10) } },
      ]);

      const totals = await service.computeTotals(1);
      expect(totals.totalPaid).toBe(90);
      expect(totals.balanceDue).toBe(10);
    });
  });

  describe('hardDeleteContract', () => {
    it('registra AuditLog con snapshot y borra DB + archivos', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        token: 'tok',
        clientName: 'Ana',
        clientEmail: 'a@b.com',
        status: 'SIGNED',
        signedAt: new Date(),
        documents: [
          { id: 11n, storagePath: 'p1', kind: 'ELECTRONIC_SIGNED_PDF' },
        ],
        payments: [
          { id: 22n, type: 'DEPOSIT', amount: new Prisma.Decimal(50) },
        ],
      });

      await service.hardDeleteContract(1, 'cleanup', 9);

      const auditCalls = mockPrisma.auditLog.create.mock.calls as unknown[][];
      const auditArgs = auditCalls[0]?.[0];
      expect(auditArgs).toMatchObject({
        data: {
          action: 'HARD_DELETE',
          entity: 'RentalContract',
          entityId: '1',
          metadata: { reason: 'cleanup' },
        },
      });
      expect(mockPrisma.rentalContract.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockStorage.remove).toHaveBeenCalledWith('p1');
    });

    it('lanza NotFound si el contrato no existe', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce(null);
      await expect(service.hardDeleteContract(99, 'x', 9)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deletePayment', () => {
    it('borra el pago y registra AuditLog con reason', async () => {
      mockPrisma.contractPayment.findUnique.mockResolvedValueOnce({
        id: 7n,
        contractId: 1,
        type: 'DEPOSIT',
        amount: new Prisma.Decimal(50),
      });
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        price: new Prisma.Decimal(100),
        deposit: new Prisma.Decimal(50),
      });
      mockPrisma.contractPayment.groupBy.mockResolvedValueOnce([]);
      const result = await service.deletePayment(1, 7n, 'mistake', 9);
      expect(result.deleted).toBe(true);
      expect(result.totals.balanceDue).toBe(100);
      const auditCalls = mockPrisma.auditLog.create.mock.calls as unknown[][];
      const auditArgs = auditCalls[0]?.[0];
      expect(auditArgs).toMatchObject({
        data: {
          action: 'DELETE',
          entity: 'ContractPayment',
          entityId: '7',
          metadata: { reason: 'mistake' },
        },
      });
    });
  });

  describe('deleteDocument', () => {
    it('borra documento y registra AuditLog', async () => {
      mockPrisma.contractDocument.findUnique.mockResolvedValueOnce({
        id: 11n,
        contractId: 1,
        kind: 'OTHER',
        storagePath: 'doc.pdf',
      });
      const result = await service.deleteDocument(1, 11n, 'duplicate', 9);
      expect(result.deleted).toBe(true);
      expect(mockPrisma.contractDocument.delete).toHaveBeenCalledWith({
        where: { id: 11n },
      });
      const auditCalls = mockPrisma.auditLog.create.mock.calls as unknown[][];
      const auditArgs = auditCalls[0]?.[0];
      expect(auditArgs).toMatchObject({
        data: {
          action: 'DELETE',
          entity: 'ContractDocument',
          entityId: '11',
          metadata: { reason: 'duplicate' },
        },
      });
      expect(mockStorage.remove).toHaveBeenCalledWith('doc.pdf');
    });
  });

  describe('updateContract', () => {
    it('impide editar un contrato SIGNED', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        status: 'SIGNED',
        archivedAt: null,
      });
      await expect(
        service.updateContract(1, { clientName: 'X' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('impide editar un contrato archivado', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        status: 'PENDING',
        archivedAt: new Date(),
      });
      await expect(
        service.updateContract(1, { clientName: 'X' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll status validation', () => {
    it('lanza 400 si status es inválido', async () => {
      await expect(service.findAll({ status: 'BOGUS' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('acepta status válidos y normaliza a upper-case', async () => {
      mockPrisma.rentalContract.findMany.mockResolvedValueOnce([]);
      mockPrisma.rentalContract.count.mockResolvedValueOnce(0);
      const result = await service.findAll({ status: 'signed' });
      expect(result.items).toEqual([]);
    });
  });

  describe('uploadDocument transaction cleanup', () => {
    const fakeFile = (kind: 'pdf' | 'png' | 'jpg') => {
      const head =
        kind === 'pdf'
          ? Buffer.from('%PDF-')
          : kind === 'png'
            ? Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
            : Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      return {
        buffer: Buffer.concat([
          head,
          Buffer.from('rest of body content padded to make size valid'),
        ]),
        originalname: `file.${kind}`,
        mimetype:
          kind === 'pdf'
            ? 'application/pdf'
            : kind === 'png'
              ? 'image/png'
              : 'image/jpeg',
        size: 1,
      } as unknown as Express.Multer.File;
    };

    it('limpia el archivo si la transacción falla en PAYMENT_RECEIPT', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        clientId: 1,
        status: 'PENDING',
        archivedAt: null,
        documents: [],
        client: { id: 1, name: 'Cliente', email: 'a@b.com' },
      });
      mockPrisma.contractPayment.findUnique.mockResolvedValueOnce({
        id: 7n,
        contractId: 1,
        type: 'DEPOSIT',
        amount: new Prisma.Decimal(50),
      });
      mockPrisma.$transaction.mockRejectedValueOnce(new Error('tx fail'));
      await expect(
        service.uploadDocument(
          1,
          fakeFile('pdf'),
          { kind: 'PAYMENT_RECEIPT', paymentId: 7 },
          5,
        ),
      ).rejects.toThrow(/tx fail/);
      expect(mockStorage.remove).toHaveBeenCalled();
    });

    it('detecta MIME por magic bytes aunque el cliente mienta', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        clientId: 1,
        status: 'PENDING',
        archivedAt: null,
        documents: [],
        client: { id: 1, name: 'Cliente', email: 'a@b.com' },
      });
      const file = fakeFile('png');
      (file as unknown as Record<string, unknown>).mimetype = 'application/pdf';
      await expect(
        service.uploadDocument(1, file, { kind: 'UPLOADED_SIGNED_PDF' }, 5),
      ).rejects.toThrow(/PDF/);
    });
  });

  describe('getPdfBufferByToken snapshot types', () => {
    it('acepta UPLOADED_SIGNED_PDF como snapshot', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        token: 'tok',
        status: 'SIGNED',
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockPrisma.contractDocument.findFirst.mockResolvedValueOnce({
        id: 11n,
        contractId: 1,
        kind: 'UPLOADED_SIGNED_PDF',
        storagePath: 'uploaded/foo.pdf',
        originalFilename: 'foo.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 11,
        sha256: 'abc',
        uploadedById: null,
        paymentId: null,
        createdAt: new Date(),
      });
      const buf = await service.getPdfBufferByToken('tok');
      expect(mockPdf.generatePdf).not.toHaveBeenCalled();
      expect(mockStorage.read).toHaveBeenCalledWith('uploaded/foo.pdf');
      expect(buf.equals(fakePdfBuffer)).toBe(true);
    });
  });

  describe('resendSigned only snapshot', () => {
    it('lee snapshot firmado y no regenera', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        token: 'tok',
        status: 'SIGNED',
        signedAt: new Date(),
        clientName: 'Ana',
        clientEmail: 'a@b.com',
        equipment: 'Bouncer',
      });
      mockPrisma.contractDocument.findFirst.mockResolvedValueOnce({
        id: 22n,
        contractId: 1,
        kind: 'ELECTRONIC_SIGNED_PDF',
        storagePath: 'snap/signed.pdf',
        originalFilename: 'signed.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 11,
        sha256: 'abc',
        uploadedById: null,
        paymentId: null,
        createdAt: new Date(),
      });
      const result = await service.resendSigned(1);
      expect(mockPdf.generatePdf).not.toHaveBeenCalled();
      expect(mockStorage.read).toHaveBeenCalledWith('snap/signed.pdf');
      expect(mockEmail.send).toHaveBeenCalled();
      expect(result.emailSent).toBe(true);
    });

    it('lanza NotFound si no hay documento firmado almacenado', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        token: 'tok',
        status: 'SIGNED',
        signedAt: new Date(),
        clientName: 'Ana',
        clientEmail: 'a@b.com',
        equipment: 'Bouncer',
      });
      mockPrisma.contractDocument.findFirst.mockResolvedValueOnce(null);
      await expect(service.resendSigned(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('hardDeleteContract', () => {
    it('registra AuditLog en transacción y registra huérfanos FS', async () => {
      mockPrisma.rentalContract.findUnique.mockResolvedValueOnce({
        id: 1,
        token: 'tok',
        clientName: 'Ana',
        clientEmail: 'a@b.com',
        status: 'SIGNED',
        signedAt: new Date(),
        documents: [
          { id: 11n, storagePath: 'p1', kind: 'ELECTRONIC_SIGNED_PDF' },
          { id: 12n, storagePath: 'p2', kind: 'OTHER' },
        ],
        payments: [
          { id: 22n, type: 'DEPOSIT', amount: new Prisma.Decimal(50) },
        ],
      });
      mockStorage.remove
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      const result = await service.hardDeleteContract(1, 'cleanup', 9);
      expect(mockPrisma.rentalContract.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockStorage.remove).toHaveBeenCalledTimes(2);
      expect(result.fsOrphans).toEqual(['p2']);
      const auditCalls = mockPrisma.auditLog.create.mock.calls as unknown[][];
      const orphanAudit = auditCalls.find(
        (c) =>
          (c[0] as { data?: { action?: string } })?.data?.action ===
          'STORAGE_CLEANUP_ORPHAN',
      );
      expect(orphanAudit).toBeDefined();
    });
  });
});
