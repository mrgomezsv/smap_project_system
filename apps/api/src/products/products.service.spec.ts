import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { TranslationService } from '../common/translation.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockPrisma = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockTranslationService = {
    translateProduct: jest.fn((product: Record<string, unknown>) =>
      Promise.resolve(product),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('retorna items y total con defaults', async () => {
      const products = [
        { id: 1n, title: 'A' },
        { id: 2n, title: 'B' },
      ];
      mockPrisma.product.findMany.mockResolvedValue(products);
      mockPrisma.product.count.mockResolvedValue(2);

      const result = await service.findAll({});

      expect(result.items).toEqual(products);
      expect(result.total).toBe(2);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 20,
          orderBy: { created: 'desc' },
        }),
      );
      const findManyCalls = mockPrisma.product.findMany.mock
        .calls as unknown[][];
      const findAllArgs = findManyCalls[0]?.[0];
      expect(findAllArgs).toMatchObject({
        select: {
          _count: {
            select: {
              likes: true,
              comments: { where: { isApproved: true } },
            },
          },
        },
      });
    });

    it('aplica filtro de categoría', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ category: 'option1' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'option1' } }),
      );
    });

    it('aplica filtro de publicated', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ publicated: true });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { publicated: true } }),
      );
    });

    it('aplica búsqueda fulltext por título y descripción', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({ search: 'brincolín' });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { search: 'brincolín' } },
              { description: { search: 'brincolín' } },
            ],
          },
        }),
      );
    });

    it('combina múltiples filtros', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.findAll({
        category: 'option2',
        publicated: true,
        search: 'mesa',
      });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            category: 'option2',
            publicated: true,
            OR: [
              { title: { search: 'mesa' } },
              { description: { search: 'mesa' } },
            ],
          },
        }),
      );
    });

    it('respeta paginación custom', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(100);

      const result = await service.findAll({ skip: 40, take: 20 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
      expect(result.skip).toBe(40);
      expect(result.take).toBe(20);
    });
  });

  describe('findByCategory', () => {
    it('filtra por categoría y solo publicated=true', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await service.findByCategory('option1');

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'option1', publicated: true },
          orderBy: { created: 'desc' },
        }),
      );
      const findByCategoryCalls = mockPrisma.product.findMany.mock
        .calls as unknown[][];
      const findByCategoryArgs = findByCategoryCalls[0]?.[0];
      expect(findByCategoryArgs).toMatchObject({
        select: {
          _count: {
            select: {
              likes: true,
              comments: { where: { isApproved: true } },
            },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('retorna producto con _count de likes y comments', async () => {
      const product = {
        id: 5n,
        title: 'Brincolín 3x3',
        _count: { likes: 10, comments: 3 },
      };
      mockPrisma.product.findUnique.mockResolvedValue(product);

      const result = await service.findOne(5);

      expect(result).toEqual(product);
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: BigInt(5) } }),
      );
      const findUniqueCalls = mockPrisma.product.findUnique.mock
        .calls as unknown[][];
      const findOneArgs = findUniqueCalls[0]?.[0];
      expect(findOneArgs).toMatchObject({
        include: {
          _count: {
            select: {
              likes: true,
              comments: { where: { isApproved: true } },
            },
          },
        },
      });
    });

    it('lanza NotFoundException si no existe', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Producto #999 no encontrado',
      );
    });
  });

  describe('create', () => {
    it('crea con valores por defecto para imágenes', async () => {
      mockPrisma.product.create.mockResolvedValue({ id: 10n, title: 'Nuevo' });

      await service.create(
        {
          title: 'Nuevo',
          category: 'option1',
        },
        7,
      );

      const createCalls = mockPrisma.product.create.mock.calls as unknown[][];
      const createArgs = createCalls[0]?.[0];
      expect(createArgs).toMatchObject({
        data: {
          title: 'Nuevo',
          category: 'option1',
          publicated: false,
          img: 'default_product_image.jpg',
          img1: 'default_product_image.jpg',
          userId: 7,
        },
      });
    });
  });

  describe('update', () => {
    it('verifica existencia y luego actualiza', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 1n });
      mockPrisma.product.update.mockResolvedValue({ id: 1n, title: 'Updated' });

      const result = await service.update(1, { title: 'Updated' });

      expect(result).toEqual({ id: 1n, title: 'Updated' });
      expect(mockPrisma.product.findUnique).toHaveBeenCalled();
      expect(mockPrisma.product.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('verifica existencia y luego elimina', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 1n });
      mockPrisma.product.delete.mockResolvedValue({ id: 1n });

      const result = await service.remove(1);

      expect(result).toEqual({ id: 1n });
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
    });
  });
});
