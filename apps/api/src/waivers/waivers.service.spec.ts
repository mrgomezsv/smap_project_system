import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WaiversService } from './waivers.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './services/pdf.service';
import { EmailService } from './services/email.service';

describe('WaiversService', () => {
  let service: WaiversService;

  const mockPrisma = {
    waiverQRV2: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    waiverDataV2: {
      deleteMany: jest.fn(),
    },
    waiverScanV2: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    waiverDocument: {
      findFirst: jest.fn(),
    },
  };
  const mockPdf = {
    generateWaiverPdf: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  };
  const mockEmail = {
    send: jest.fn().mockResolvedValue(true),
    getWaiverEmailTemplate: jest
      .fn()
      .mockReturnValue({ subject: 's', html: '<p>x</p>' }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WaiversService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PdfService, useValue: mockPdf },
        { provide: EmailService, useValue: mockEmail },
      ] as any,
    }).compile();
    service = module.get(WaiversService);
    jest.clearAllMocks();
    mockPrisma.waiverQRV2.update.mockResolvedValue({});
    mockPrisma.waiverQRV2.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.waiverDataV2.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.waiverScanV2.deleteMany.mockResolvedValue({ count: 0 });
  });

  describe('generateUniqueQr', () => {
    it('genera 8 caracteres uppercase', () => {
      const qr = (service as any).generateUniqueQr();
      expect(qr).toHaveLength(8);
      expect(qr).toMatch(/^[A-F0-9]+$/);
    });

    it('genera QRs únicos en llamadas consecutivas', () => {
      const qrs = new Set();
      for (let i = 0; i < 50; i++) {
        qrs.add((service as any).generateUniqueQr());
      }
      // En 50 iteraciones，我们应该 tener ~50 únicos (puede haber 1-2 colisiones con 16M de espacio)
      expect(qrs.size).toBeGreaterThanOrEqual(48);
    });
  });

  describe('findByQr', () => {
    it('normaliza el QR a uppercase antes de buscar', async () => {
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue({
        id: 1n,
        qrCode: 'ABCD1234',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 86400000),
        relatives: [],
      });

      await service.findByQr('abcd1234');

      expect(mockPrisma.waiverQRV2.findUnique).toHaveBeenCalledWith({
        where: { qrCode: 'ABCD1234' },
        include: { relatives: true },
      });
    });

    it('lanza NotFoundException si no existe', async () => {
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue(null);
      await expect(service.findByQr('NOEXISTE')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('marca isValid=false si waiver está expirado', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue({
        id: 1n,
        qrCode: 'OLDQR',
        status: 'ACTIVE',
        expiresAt: past,
        relatives: [],
      });

      const result = await service.findByQr('OLDQR');
      expect(result.isValid).toBe(false);
    });

    it('marca isValid=true si waiver está activo y no expirado', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue({
        id: 1n,
        qrCode: 'GOODQR',
        status: 'ACTIVE',
        expiresAt: future,
        relatives: [],
      });

      const result = await service.findByQr('GOODQR');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validate', () => {
    it('devuelve valid:false si QR no existe', async () => {
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue(null);
      const result = await service.validate('NOTEXIST', 'user@example.com');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('QR no encontrado');
    });

    it('registra scan si waiver válido', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue({
        id: 1n,
        qrCode: 'ABCD1234',
        status: 'ACTIVE',
        expiresAt: future,
        relatives: [],
      });
      const result = await service.validate('ABCD1234', 'collab@example.com');
      expect(result.valid).toBe(true);
      expect(mockPrisma.waiverScanV2.create).toHaveBeenCalledWith({
        data: { waiverQrId: 1n, scannedBy: 'collab@example.com' },
      });
    });

    it('NO registra scan si waiver expirado', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue({
        id: 1n,
        qrCode: 'OLDQR001',
        status: 'ACTIVE',
        expiresAt: past,
        relatives: [],
      });
      const result = await service.validate('OLDQR001', 'collab@example.com');
      expect(result.valid).toBe(false);
      expect(mockPrisma.waiverScanV2.create).not.toHaveBeenCalled();
    });

    it('NO registra scan si waiver ya está INACTIVE', async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue({
        id: 1n,
        qrCode: 'INACTVR',
        status: 'INACTIVE',
        expiresAt: future,
        relatives: [],
      });
      const result = await service.validate('INACTVR', 'collab@example.com');
      expect(result.valid).toBe(false);
      expect(mockPrisma.waiverScanV2.create).not.toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('rechaza si requestingUserId != targetUserId', async () => {
      await expect(service.findByUser('user-a', 'user-b')).rejects.toThrow(
        'Solo puedes ver tus propios waivers',
      );
    });

    it('retorna waivers del usuario autorizado', async () => {
      const waivers = [
        { id: 1n, qrCode: 'AAA1', relatives: [], scans: [] },
        { id: 2n, qrCode: 'BBB2', relatives: [], scans: [] },
      ];
      mockPrisma.waiverQRV2.findMany.mockResolvedValue(waivers);

      const result = await service.findByUser('user-x', 'user-x');

      expect(result.totalCount).toBe(2);
      expect(mockPrisma.waiverQRV2.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-x' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('isExpired', () => {
    it('devuelve true para fecha pasada', () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      expect((service as any).isExpired(past)).toBe(true);
    });

    it('devuelve false para fecha futura', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      expect((service as any).isExpired(future)).toBe(false);
    });
  });

  describe('findAll', () => {
    it('pasa status al where cuando es ACTIVE/INACTIVE', async () => {
      mockPrisma.waiverQRV2.findMany.mockResolvedValue([]);
      mockPrisma.waiverQRV2.count.mockResolvedValue(0);
      await service.findAll({ take: 10, skip: 0, status: 'ACTIVE' });
      expect(mockPrisma.waiverQRV2.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'ACTIVE' } }),
      );
      expect(mockPrisma.waiverQRV2.count).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
      });
    });

    it('omite el filtro de status cuando es undefined', async () => {
      mockPrisma.waiverQRV2.findMany.mockResolvedValue([]);
      mockPrisma.waiverQRV2.count.mockResolvedValue(0);
      await service.findAll({ take: 10, skip: 0 });
      expect(mockPrisma.waiverQRV2.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('ignora status con valores no permitidos', async () => {
      mockPrisma.waiverQRV2.findMany.mockResolvedValue([]);
      mockPrisma.waiverQRV2.count.mockResolvedValue(0);
      await service.findAll({ take: 10, skip: 0, status: 'OTRO' });
      expect(mockPrisma.waiverQRV2.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('calcula hasMore cuando hay más páginas', async () => {
      const waivers = [
        {
          id: 1n,
          qrCode: 'A1',
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 1e8),
          relatives: [],
          scans: [],
        },
      ];
      mockPrisma.waiverQRV2.findMany.mockResolvedValue(waivers);
      mockPrisma.waiverQRV2.count.mockResolvedValue(5);
      const result = await service.findAll({ take: 1, skip: 0 });
      expect(result.hasMore).toBe(true);
      expect(result.totalCount).toBe(5);
      expect(result.waivers).toHaveLength(1);
    });

    it('hasMore=false cuando se muestran todos', async () => {
      const waivers = [
        {
          id: 1n,
          qrCode: 'A1',
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 1e8),
          relatives: [],
          scans: [],
        },
      ];
      mockPrisma.waiverQRV2.findMany.mockResolvedValue(waivers);
      mockPrisma.waiverQRV2.count.mockResolvedValue(1);
      const result = await service.findAll({ take: 50, skip: 0 });
      expect(result.hasMore).toBe(false);
    });
  });

  describe('deleteMany', () => {
    it('lanza BadRequestException si ids está vacío', async () => {
      await expect(service.deleteMany([])).rejects.toThrow('al menos un ID');
      await expect(service.deleteMany(undefined as any)).rejects.toThrow(
        'al menos un ID',
      );
    });

    it('borra relatives, scans y waivers en orden', async () => {
      mockPrisma.waiverDataV2.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.waiverScanV2.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.waiverQRV2.deleteMany.mockResolvedValue({ count: 2 });
      const result = await service.deleteMany(['1', '2']);
      expect(mockPrisma.waiverDataV2.deleteMany).toHaveBeenCalledWith({
        where: { waiverQrId: { in: [1n, 2n] } },
      });
      expect(mockPrisma.waiverScanV2.deleteMany).toHaveBeenCalledWith({
        where: { waiverQrId: { in: [1n, 2n] } },
      });
      expect(mockPrisma.waiverQRV2.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [1n, 2n] } },
      });
      expect(result.count).toBe(2);
      expect(result.success).toBe(true);
    });

    it('acepta ids numéricos', async () => {
      mockPrisma.waiverDataV2.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.waiverScanV2.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.waiverQRV2.deleteMany.mockResolvedValue({ count: 1 });
      const result = await service.deleteMany([42]);
      expect(mockPrisma.waiverQRV2.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [42n] } },
      });
      expect(result.count).toBe(1);
    });
  });

  describe('getCollaboratorScans', () => {
    it('filtra scans por email del colaborador', async () => {
      const scans = [
        { id: 1n, waiverQrId: 9n, scannedBy: 'a@x', scannedAt: new Date() },
      ];
      mockPrisma.waiverScanV2.findMany.mockResolvedValue(scans);
      const result = await service.getCollaboratorScans('a@x');
      expect(mockPrisma.waiverScanV2.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { scannedBy: 'a@x' },
          orderBy: { scannedAt: 'desc' },
          include: { waiverQr: true },
        }),
      );
      expect(result.totalCount).toBe(1);
      expect(result.scans).toEqual(scans);
    });
  });

  describe('generatePdf', () => {
    it('lanza NotFoundException si el QR no existe', async () => {
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue(null);
      await expect(service.generatePdf('NOEXISTE')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devuelve Buffer del PDF generado', async () => {
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue({
        id: 1n,
        qrCode: 'ABCD1234',
        userName: 'X',
        userId: 'u',
        userEmail: 'a@b.c',
        userPhone: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1e8),
        relatives: [],
      });
      const buf = await service.generatePdf('ABCD1234');
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.length).toBe(3);
    });
  });

  describe('resendWaiverEmail', () => {
    it('lanza NotFoundException si el QR no existe', async () => {
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue(null);
      await expect(service.resendWaiverEmail('NOEXISTE', 'es')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('reenvía email con PDF adjunto si el waiver existe', async () => {
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue({
        id: 1n,
        qrCode: 'ABCD1234',
        userName: 'X',
        userId: 'u',
        userEmail: 'a@b.c',
        userPhone: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1e8),
        relatives: [],
      });
      mockEmail.send.mockResolvedValue(true);
      const sent = await service.resendWaiverEmail('ABCD1234', 'es');
      expect(sent).toBe(true);
      expect(mockEmail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'a@b.c',
          attachments: expect.arrayContaining([
            expect.objectContaining({ filename: 'waiver_ABCD1234.pdf' }),
          ]),
        }),
      );
    });
  });

  describe('create', () => {
    it('genera QR, persiste el waiver y devuelve el qrCode', async () => {
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue(null);
      mockPrisma.waiverQRV2.create.mockResolvedValue({
        id: 99n,
        qrCode: 'NEWQR001',
        userId: 'firebase-uid',
        userName: 'Test',
        userEmail: 'a@b.c',
        userPhone: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1e8),
        relatives: [],
      });
      mockPrisma.waiverDocument.findFirst.mockResolvedValue({
        content: 'legal',
      });

      const result = await service.create('firebase-uid', {
        userName: 'Test',
        userEmail: 'a@b.c',
        relatives: [{ name: 'Hijo', age: 10 }],
      });

      expect(result.qrCode).toBe('NEWQR001');
      expect(mockPrisma.waiverQRV2.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'firebase-uid',
            userName: 'Test',
            userEmail: 'a@b.c',
            status: 'ACTIVE',
            relatives: {
              create: [{ relativeName: 'Hijo', relativeAge: 10 }],
            },
          }),
          include: { relatives: true },
        }),
      );
    });

    it('intenta hasta 10 veces regenerar QR si hay colisión', async () => {
      mockPrisma.waiverQRV2.findUnique
        .mockResolvedValueOnce({ id: 1n })
        .mockResolvedValueOnce({ id: 1n })
        .mockResolvedValue(null);
      mockPrisma.waiverQRV2.create.mockResolvedValue({
        id: 2n,
        qrCode: 'ZZ',
        userName: 'X',
        userId: 'u',
        userEmail: 'a@b.c',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1e8),
        relatives: [],
      });
      mockPrisma.waiverDocument.findFirst.mockResolvedValue(null);

      await service.create('u', {
        userName: 'X',
        userEmail: 'a@b.c',
        relatives: [],
      });

      expect(mockPrisma.waiverQRV2.findUnique).toHaveBeenCalledTimes(3);
      expect(mockPrisma.waiverQRV2.create).toHaveBeenCalledTimes(1);
    });

    it('falla si no se logra generar QR único tras 10 intentos', async () => {
      mockPrisma.waiverQRV2.findUnique.mockResolvedValue({ id: 1n });
      await expect(
        service.create('u', {
          userName: 'X',
          userEmail: 'a@b.c',
          relatives: [],
        } as any),
      ).rejects.toThrow('No se pudo generar un QR único');
    });
  });
});
