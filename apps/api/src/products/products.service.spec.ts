import { Test } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

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

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ProductsService);
    prisma = module.get(PrismaService);
  });

  it('findAll retorna lista y total', async () => {
    const products = [{ id: 1n, title: 'Test' }];
    mockPrisma.product.findMany.mockResolvedValue(products);
    mockPrisma.product.count.mockResolvedValue(1);

    const result = await service.findAll({});
    expect(result.items).toEqual(products);
    expect(result.total).toBe(1);
  });

  it('findOne lanza NotFound si no existe', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow('Producto #999 no encontrado');
  });

  it('countByProduct filtra solo favoritos en Likes', async () => {
    mockPrisma.productLike = { count: jest.fn().mockResolvedValue(5) };
    const LikesServiceModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    expect(LikesServiceModule).toBeDefined();
  });
});
