import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Total de likes (favoritos) de un producto.
   * Cuenta solo los marcados como favoritos (is_favorite = true).
   */
  async countByProduct(productId: number): Promise<{ count: number }> {
    const count = await this.prisma.productLike.count({
      where: { productId: BigInt(productId), isFavorite: true },
    });
    return { count };
  }

  /**
   * Verifica si el usuario tiene el producto marcado como favorito.
   */
  async userHasFavorite(
    userId: number,
    productId: number,
  ): Promise<{ isFavorite: boolean }> {
    const like = await this.prisma.productLike.findUnique({
      where: { userId_productId: { userId, productId: BigInt(productId) } },
    });
    return { isFavorite: like?.isFavorite ?? false };
  }

  /**
   * Toggle del like de un usuario sobre un producto.
   * - Si no existe el registro: lo crea con isFavorite=true
   * - Si existe: lo invierte (true→false, false→true)
   * Devuelve el estado resultante.
   */
  async toggle(
    userId: number,
    productId: number,
  ): Promise<{ isFavorite: boolean }> {
    // Verificar que el producto existe
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(productId) },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto #${productId} no encontrado`);
    }

    const existing = await this.prisma.productLike.findUnique({
      where: { userId_productId: { userId, productId: BigInt(productId) } },
    });

    let isFavorite: boolean;
    if (!existing) {
      await this.prisma.productLike.create({
        data: { userId, productId: BigInt(productId), isFavorite: true },
      });
      isFavorite = true;
    } else {
      isFavorite = !existing.isFavorite;
      await this.prisma.productLike.update({
        where: { userId_productId: { userId, productId: BigInt(productId) } },
        data: { isFavorite },
      });
    }
    return { isFavorite };
  }
}
