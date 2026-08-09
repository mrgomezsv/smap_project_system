import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Limpia el texto del comentario eliminando caracteres de control no válidos.
 * Equivalente al clean_comment() del Django ProductComment.
 */
function sanitizeComment(text: string): string {
  // Eliminar caracteres de control (excepto saltos de línea) y caracteres no-Unicode
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[^\x00-\x7F\u00A0-\uFFFF]/g, '')
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
      replies: c.replies,
    }));
  }

  /**
   * Lista TODOS los comentarios para el panel de administración (con opción de búsqueda y estado).
   */
  async findAll(query?: { search?: string; status?: 'all' | 'pending' | 'approved'; skip?: number; take?: number }) {
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

    const take = query?.take ? Number(query.take) : 50;
    const skip = query?.skip ? Number(query.skip) : 0;

    const [items, total] = await Promise.all([
      this.prisma.productComment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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

    const nextState = isApproved !== undefined ? isApproved : !existing.isApproved;

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

    // Borrar primero las respuestas ligadas (CommentReply) para evitar error FK
    await this.prisma.commentReply.deleteMany({
      where: { commentId: BigInt(id) },
    });

    await this.prisma.productComment.delete({
      where: { id: BigInt(id) },
    });

    return { success: true, message: `Comentario #${id} eliminado correctamente.` };
  }

  /**
   * Crea un comentario en un producto.
   * Valida que el producto exista y limpia el texto.
   */
  async create(productId: number, userId: string, userDisplayName: string, comment: string) {
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

    return this.prisma.productComment.create({
      data: {
        productId: BigInt(productId),
        userId,
        userDisplayName,
        comment: cleanComment,
        isApproved: true, // Aprobado por defecto
      },
    });
  }
}
