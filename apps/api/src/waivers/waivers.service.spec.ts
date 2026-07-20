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
    },
    waiverScanV2: {
      create: jest.fn(),
      findMany: jest.fn(),
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
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WaiversService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PdfService, useValue: mockPdf },
        { provide: EmailService, useValue: mockEmail },
      ],
    }).compile();
    service = module.get(WaiversService);
    jest.clearAllMocks();
    mockPrisma.waiverQRV2.update.mockResolvedValue({});
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
      await expect(service.findByQr('NOEXISTE')).rejects.toThrow(NotFoundException);
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
});
