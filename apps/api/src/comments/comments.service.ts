import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Limpia el texto del comentario eliminando caracteres de control no válidos.
 * Equivalente al clean_comment() del Django ProductComment.
 */
function sanitizeComment(text: string): string {
  return Array.from(text)
    .filter((character) => {
      const codePoint = character.codePointAt(0);
      return (
        codePoint !== undefined &&
        (codePoint === 9 ||
          codePoint === 10 ||
          codePoint === 13 ||
          (codePoint >= 32 && codePoint !== 127))
      );
    })
    .join('')
    .trim();
}

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista solo los comentarios APROBADOS de un producto para la vista pública.
   * Soporta paginación por cursor o skip/take.
   */
  async findByProduct(
    productId: number,
    opts: { take?: number; skip?: number; cursor?: number } = {},
  ) {
    const take = Math.min(opts.take ?? 20, 50);
    const comments = await this.prisma.productComment.findMany({
      where: {
        productId: BigInt(productId),
        isApproved: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip: opts.skip,
      ...(opts.cursor && { cursor: { id: BigInt(opts.cursor) } }),
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
          take: 10,
        },
      },
    });

    return comments.map((c) => ({
      id: Number(c.id),
      productId: Number(c.productId),
      authorName: c.userDisplayName || 'Usuario',
      comment: c.comment,
      createdAt: c.createdAt,
      isApproved: c.isApproved,
      replies: c.replies,
    }));
  }

  /**
   * Lista TODOS los comentarios para el panel de administración (con opción de búsqueda y estado).
   */
  async findAll(query?: {
    search?: string;
    status?: 'all' | 'pending' | 'approved';
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.ProductCommentWhereInput = {};
    if (query?.status === 'pending') where.isApproved = false;
    if (query?.status === 'approved') where.isApproved = true;

    if (query?.search) {
      const term = query.search.trim();
      where.OR = [
        { comment: { contains: term } },
        { userDisplayName: { contains: term } },
        { product: { title: { contains: term } } },
      ];
    }

    const take = Math.min(Math.max(query?.take ?? 50, 1), 100);
    const skip = Math.max(query?.skip ?? 0, 0);

    const [items, total] = await Promise.all([
      this.prisma.productComment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          product: {
            select: { id: true, title: true, img: true },
          },
        },
        take,
        skip,
      }),
      this.prisma.productComment.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  /**
   * Cambia el estado de aprobación de un comentario (Aprobar / Ocultar).
   */
  async toggleApproval(id: number, isApproved?: boolean) {
    const existing = await this.prisma.productComment.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      throw new NotFoundException(`Comentario #${id} no encontrado`);
    }

    const nextState =
      isApproved !== undefined ? isApproved : !existing.isApproved;

    return this.prisma.productComment.update({
      where: { id: BigInt(id) },
      data: { isApproved: nextState },
    });
  }

  /**
   * Elimina un comentario permanentemente (admin only).
   */
  async remove(id: number) {
    const existing = await this.prisma.productComment.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      throw new NotFoundException(`Comentario #${id} no encontrado`);
    }

    await this.prisma.$transaction([
      this.prisma.commentReply.deleteMany({
        where: { commentId: BigInt(id) },
      }),
      this.prisma.productComment.delete({
        where: { id: BigInt(id) },
      }),
    ]);

    return {
      success: true,
      message: `Comentario #${id} eliminado correctamente.`,
    };
  }

  /**
   * Crea un comentario en un producto.
   * Valida que el producto exista y limpia el texto.
   */
  async create(
    productId: number,
    userId: string,
    userDisplayName: string,
    comment: string,
    userIdInt?: number,
  ) {
    if (!comment || !comment.trim()) {
      throw new BadRequestException('El comentario no puede estar vacío');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(productId) },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto #${productId} no encontrado`);
    }

    const cleanComment = sanitizeComment(comment);
    if (!cleanComment) {
      throw new BadRequestException('El comentario no contiene texto válido');
    }

    const created = await this.prisma.productComment.create({
      data: {
        productId: BigInt(productId),
        userId,
        userIdInt,
        userDisplayName,
        comment: cleanComment,
        isApproved: false,
      },
    });

    return {
      id: Number(created.id),
      productId: Number(created.productId),
      authorName: created.userDisplayName || 'Usuario',
      comment: created.comment,
      createdAt: created.createdAt,
      isApproved: created.isApproved,
    };
  }
}
