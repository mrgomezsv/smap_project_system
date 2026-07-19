import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
   * Lista todos los comentarios de un producto, ordenados del más reciente al más antiguo.
   * Incluye las replies anidadas.
   */
  async findByProduct(productId: number) {
    return this.prisma.productComment.findMany({
      where: { productId: BigInt(productId) },
      orderBy: { createdAt: 'desc' },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
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
      },
    });
  }
}
