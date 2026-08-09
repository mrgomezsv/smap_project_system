import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let service: ClientsService;

  const mockPrisma = {
    client: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ClientsService);
  });

  describe('list', () => {
    it('aplica paginación segura y devuelve total', async () => {
      const items = [{ id: 1, email: 'a@b.com', name: 'A' }];
      mockPrisma.client.findMany.mockResolvedValue(items);
      mockPrisma.client.count.mockResolvedValue(1);

      const result = await service.list({ skip: 0, take: 10 });

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
      expect(result).toEqual({ items, total: 1, skip: 0, take: 10 });
    });

    it('cap take al máximo permitido (100)', async () => {
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.client.count.mockResolvedValue(0);

      const result = await service.list({ take: 500 });

      expect(result.take).toBe(100);
    });

    it('construye filtro OR normalizado por search', async () => {
      mockPrisma.client.findMany.mockResolvedValue([]);
      mockPrisma.client.count.mockResolvedValue(0);

      await service.list({ search: 'Ana' });

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: { contains: 'ana' } },
              { name: { contains: 'Ana' } },
              { phone: { contains: 'Ana' } },
            ],
          },
        }),
      );
    });
  });

  describe('findById', () => {
    it('lanza NotFoundException si no existe', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
      await expect(service.findById(99)).rejects.toThrow(
        'Cliente #99 no encontrado',
      );
    });

    it('devuelve el cliente con sus contratos recientes', async () => {
      const client = { id: 1, email: 'a@b.com', rentalContracts: [] };
      mockPrisma.client.findUnique.mockResolvedValue(client);

      const result = await service.findById(1);

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(result).toBe(client);
    });
  });

  describe('create', () => {
    it('normaliza email y crea el cliente', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      mockPrisma.client.findFirst.mockResolvedValue(null);
      mockPrisma.client.create.mockResolvedValue({ id: 1, email: 'a@b.com' });

      await service.create({
        email: '  A@B.com  ',
        name: 'Ana',
        phone: '',
        address: '   ',
      });

      expect(mockPrisma.client.create).toHaveBeenCalledWith({
        data: {
          email: 'a@b.com',
          name: 'Ana',
          phone: null,
          address: null,
          cityStateZip: null,
          driverLicense: null,
          userId: null,
          source: 'manual',
          notes: null,
          isActive: true,
        },
      });
    });

    it('rechaza email repetido', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
      });

      await expect(
        service.create({ email: 'a@b.com', name: 'Ana' }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.client.create).not.toHaveBeenCalled();
    });

    it('rechaza userId ya enlazado a otro client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      mockPrisma.client.findFirst.mockResolvedValueOnce({ id: 99 });

      await expect(
        service.create({ email: 'a@b.com', name: 'Ana', userId: 5 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('lanza NotFoundException si el cliente no existe', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.update(1, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('no pisa con strings vacíos', async () => {
      mockPrisma.client.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'a@b.com',
      });
      mockPrisma.client.update.mockResolvedValue({ id: 1 });

      await service.update(1, { phone: '', cityStateZip: '   ' });

      const updateCalls = mockPrisma.client.update.mock.calls as unknown[][];
      const updateArgs = updateCalls[0]?.[0] as {
        data?: Record<string, unknown>;
      };
      expect(updateArgs.data).not.toHaveProperty('phone');
      expect(updateArgs.data).not.toHaveProperty('cityStateZip');
    });

    it('actualiza campos válidos y normaliza email', async () => {
      mockPrisma.client.findUnique.mockResolvedValueOnce({
        id: 1,
        email: 'a@b.com',
      });
      mockPrisma.client.findUnique.mockResolvedValueOnce(null);
      mockPrisma.client.update.mockResolvedValue({ id: 1, email: 'new@b.com' });

      await service.update(1, {
        email: '  NEW@B.com  ',
        name: 'Ana',
        isActive: false,
      });

      const updateCalls = mockPrisma.client.update.mock.calls as unknown[][];
      const updateArgs = updateCalls[0]?.[0];
      expect(updateArgs).toMatchObject({
        where: { id: 1 },
        data: {
          email: 'new@b.com',
          name: 'Ana',
          isActive: false,
        },
      });
    });
  });

  describe('resolveForContract', () => {
    it('devuelve por clientId si existe', async () => {
      const client = { id: 1, email: 'a@b.com' };
      mockPrisma.client.findUnique.mockResolvedValue(client);

      const result = await service.resolveForContract({
        clientId: 1,
        email: 'z@x.com',
      });

      expect(result).toBe(client);
      expect(mockPrisma.client.create).not.toHaveBeenCalled();
    });

    it('hace upsert por email si no existe y crea uno nuevo', async () => {
      mockPrisma.client.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.client.create.mockResolvedValue({ id: 2, email: 'new@b.com' });

      const result = await service.resolveForContract({
        email: '  NEW@B.com  ',
        name: 'Cliente',
      });

      const createCalls = mockPrisma.client.create.mock.calls as unknown[][];
      const createArgs = createCalls[0]?.[0];
      expect(createArgs).toMatchObject({
        data: {
          email: 'new@b.com',
          name: 'Cliente',
          source: 'contract',
        },
      });
      expect(result).toEqual({ id: 2, email: 'new@b.com' });
    });

    it('retorna null si no hay clientId ni email utilizable', async () => {
      const result = await service.resolveForContract({ email: '   ' });

      expect(result).toBeNull();
      expect(mockPrisma.client.create).not.toHaveBeenCalled();
    });

    it('lanza NotFound si clientId se pasa pero no existe (sin fallback silencioso)', async () => {
      mockPrisma.client.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.resolveForContract({ clientId: 999, email: 'a@b.com' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.client.create).not.toHaveBeenCalled();
    });
  });

  describe('upsertFromAuth', () => {
    it('crea un Client nuevo cuando no existe', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      mockPrisma.client.create.mockResolvedValue({ id: 5, email: 'a@b.com' });

      const result = await service.upsertFromAuth({
        email: 'A@B.com',
        name: 'Ana',
        userId: 10,
        source: 'firebase',
      });

      const createCalls = mockPrisma.client.create.mock.calls as unknown[][];
      const createArgs = createCalls[0]?.[0];
      expect(createArgs).toMatchObject({
        data: {
          email: 'a@b.com',
          name: 'Ana',
          userId: 10,
          source: 'firebase',
        },
      });
      expect(result).toEqual({ id: 5, email: 'a@b.com' });
    });

    it('no sobrescribe con strings vacíos cuando skipEmptyOverwrites=true', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        name: 'Ana',
        phone: '555',
        userId: 10,
      });

      await service.upsertFromAuth({
        email: 'a@b.com',
        name: '',
        phone: '',
        skipEmptyOverwrites: true,
      });

      expect(mockPrisma.client.update).not.toHaveBeenCalled();
    });

    it('no sobrescribe nombre útil cuando existe en Client existente', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        name: 'Ana Pérez',
        userId: 10,
      });

      await service.upsertFromAuth({
        email: 'a@b.com',
        name: 'Nuevo Nombre',
        skipEmptyOverwrites: true,
      });

      const updateCalls = mockPrisma.client.update.mock.calls as unknown[][];
      if (updateCalls.length > 0) {
        const updateArgs = updateCalls[0]?.[0] as {
          data?: Record<string, unknown>;
        };
        expect(updateArgs.data).not.toHaveProperty('name');
      }
    });

    it('actualiza nombre si el existente es placeholder (email como nombre)', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        name: 'a@b.com',
        userId: 10,
      });
      mockPrisma.client.update.mockResolvedValue({ id: 1, name: 'Ana Real' });

      await service.upsertFromAuth({
        email: 'a@b.com',
        name: 'Ana Real',
        skipEmptyOverwrites: true,
      });

      const updateCalls = mockPrisma.client.update.mock.calls as unknown[][];
      const updateArgs = updateCalls[0]?.[0];
      expect(updateArgs).toMatchObject({
        data: { name: 'Ana Real' },
      });
    });

    it('omite re-enlace si el userId ya está en otro Client', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        userId: 20,
      });
      mockPrisma.client.findFirst.mockResolvedValueOnce({ id: 99 });

      await service.upsertFromAuth({
        email: 'a@b.com',
        name: 'Ana',
        userId: 50,
      });

      const updateCalls = mockPrisma.client.update.mock.calls as unknown[][];
      const updateArgs = updateCalls[0]?.[0] as {
        data?: Record<string, unknown>;
      };
      expect(updateArgs.data).not.toHaveProperty('user');
    });

    it('resuelve vínculo histórico antes de crear', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);
      mockPrisma.client.create.mockResolvedValue({ id: 6, email: 'a@b.com' });

      await service.upsertFromAuth({
        email: 'a@b.com',
        name: 'Ana',
        userId: 10,
        source: 'firebase',
      });

      const createCalls = mockPrisma.client.create.mock.calls as unknown[][];
      const createArgs = createCalls[0]?.[0];
      expect(createArgs).toMatchObject({
        data: { userId: 10 },
      });
    });
  });

  describe('resolveById / resolveByEmail', () => {
    it('resolveById devuelve el client', async () => {
      const client = { id: 1, email: 'a@b.com' };
      mockPrisma.client.findUnique.mockResolvedValue(client);

      const result = await service.resolveById(1);

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBe(client);
    });

    it('resolveByEmail normaliza email antes de buscar', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
      });

      await service.resolveByEmail('  A@B.COM ');

      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
      });
    });
  });
});
