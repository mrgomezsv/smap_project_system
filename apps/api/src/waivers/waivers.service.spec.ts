import { Test } from '@nestjs/testing';
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
  });

  describe('generateUniqueQr', () => {
    it('genera 8 caracteres uppercase', () => {
      const qr = (service as any).generateUniqueQr();
      expect(qr).toHaveLength(8);
      expect(qr).toMatch(/^[A-F0-9]+$/);
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
  });

  describe('findByUser', () => {
    it('rechaza si requestingUserId != targetUserId', async () => {
      await expect(service.findByUser('user-a', 'user-b')).rejects.toThrow(
        'Solo puedes ver tus propios waivers',
      );
    });
  });
});
