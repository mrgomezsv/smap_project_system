import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService', () => {
  let service: EventsService;

  const mockPrisma = {
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(EventsService);
  });

  describe('findAll', () => {
    it('ordena por startDatetime ascendente (próximos primero)', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(0);

      await service.findAll({});

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { startDatetime: 'asc' } }),
      );
    });

    it('aplica filtro de published', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(0);

      await service.findAll({ published: true });

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { published: true } }),
      );
    });

    it('aplica filtro de partners', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(0);

      await service.findAll({ partners: 'partner1' });

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { partners: 'partner1' } }),
      );
    });

    it('aplica búsqueda por título', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(0);

      await service.findAll({ search: 'inauguración' });

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { title: { contains: 'inauguración' } },
        }),
      );
    });

    it('respeta paginación', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);
      mockPrisma.event.count.mockResolvedValue(50);

      const result = await service.findAll({ skip: 10, take: 5 });

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
      expect(result.skip).toBe(10);
      expect(result.take).toBe(5);
    });
  });

  describe('findOne', () => {
    it('retorna evento con organizer', async () => {
      const event = {
        id: 1n,
        title: 'Gran Inauguración',
        organizer: { id: 5, username: 'admin' },
      };
      mockPrisma.event.findUnique.mockResolvedValue(event);

      const result = await service.findOne(1);

      expect(result).toEqual(event);
      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        include: { organizer: { select: { id: true, username: true } } },
      });
    });

    it('lanza NotFoundException si no existe', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Evento #999 no encontrado',
      );
    });
  });
});
