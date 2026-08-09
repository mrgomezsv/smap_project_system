import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockPrisma = {
    productComment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    commentReply: {
      deleteMany: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(CommentsService);
  });

  describe('findByProduct', () => {
    it('retorna únicamente comentarios aprobados con la forma pública', async () => {
      const createdAt = new Date('2026-08-09T12:00:00Z');
      mockPrisma.productComment.findMany.mockResolvedValue([
        {
          id: 4n,
          productId: 2n,
          userDisplayName: 'Ana',
          comment: 'Excelente',
          createdAt,
          isApproved: true,
          replies: [],
        },
      ]);

      const result = await service.findByProduct(2);

      expect(mockPrisma.productComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 2n, isApproved: true },
          take: 20,
        }),
      );
      expect(result).toEqual([
        {
          id: 4,
          productId: 2,
          authorName: 'Ana',
          comment: 'Excelente',
          createdAt,
          isApproved: true,
          replies: [],
        },
      ]);
    });
  });

  describe('findAll', () => {
    it('filtra los comentarios pendientes y usa un orden estable', async () => {
      mockPrisma.productComment.findMany.mockResolvedValue([]);
      mockPrisma.productComment.count.mockResolvedValue(0);

      const result = await service.findAll({ status: 'pending' });

      expect(mockPrisma.productComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isApproved: false },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: 0,
          take: 50,
        }),
      );
      expect(result).toEqual({ items: [], total: 0, skip: 0, take: 50 });
    });

    it('limita la paginación a valores seguros', async () => {
      mockPrisma.productComment.findMany.mockResolvedValue([]);
      mockPrisma.productComment.count.mockResolvedValue(0);

      const result = await service.findAll({ skip: -10, take: 500 });

      expect(result.skip).toBe(0);
      expect(result.take).toBe(100);
    });
  });

  describe('toggleApproval', () => {
    it('aplica explícitamente el estado solicitado', async () => {
      mockPrisma.productComment.findUnique.mockResolvedValue({
        id: 7n,
        isApproved: true,
      });
      mockPrisma.productComment.update.mockResolvedValue({
        id: 7n,
        isApproved: false,
      });

      await service.toggleApproval(7, false);

      expect(mockPrisma.productComment.update).toHaveBeenCalledWith({
        where: { id: 7n },
        data: { isApproved: false },
      });
    });

    it('rechaza un comentario inexistente', async () => {
      mockPrisma.productComment.findUnique.mockResolvedValue(null);

      await expect(service.toggleApproval(99, true)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.productComment.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina primero las respuestas y después el comentario', async () => {
      mockPrisma.productComment.findUnique.mockResolvedValue({ id: 8n });
      mockPrisma.commentReply.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.productComment.delete.mockResolvedValue({ id: 8n });

      const result = await service.remove(8);

      expect(mockPrisma.commentReply.deleteMany).toHaveBeenCalledWith({
        where: { commentId: 8n },
      });
      expect(mockPrisma.productComment.delete).toHaveBeenCalledWith({
        where: { id: 8n },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(
        mockPrisma.commentReply.deleteMany.mock.invocationCallOrder[0],
      ).toBeLessThan(
        mockPrisma.productComment.delete.mock.invocationCallOrder[0],
      );
      expect(result.success).toBe(true);
    });
  });

  describe('create', () => {
    it('crea el comentario pendiente y devuelve la forma pública', async () => {
      const createdAt = new Date('2026-08-09T12:00:00Z');
      mockPrisma.product.findUnique.mockResolvedValue({ id: 3n });
      mockPrisma.productComment.create.mockResolvedValue({
        id: 10n,
        productId: 3n,
        userDisplayName: 'Mario',
        comment: 'Muy bueno',
        createdAt,
        isApproved: false,
      });

      const result = await service.create(
        3,
        'firebase-uid',
        'Mario',
        '  Muy\u0000 bueno  ',
        15,
      );

      expect(mockPrisma.productComment.create).toHaveBeenCalledWith({
        data: {
          productId: 3n,
          userId: 'firebase-uid',
          userIdInt: 15,
          userDisplayName: 'Mario',
          comment: 'Muy bueno',
          isApproved: false,
        },
      });
      expect(result).toEqual({
        id: 10,
        productId: 3,
        authorName: 'Mario',
        comment: 'Muy bueno',
        createdAt,
        isApproved: false,
      });
    });

    it('rechaza comentarios vacíos', async () => {
      await expect(
        service.create(3, 'firebase-uid', 'Mario', '   ', 15),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.product.findUnique).not.toHaveBeenCalled();
    });

    it('rechaza productos inexistentes', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.create(999, 'firebase-uid', 'Mario', 'Comentario', 15),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.productComment.create).not.toHaveBeenCalled();
    });
  });
});
