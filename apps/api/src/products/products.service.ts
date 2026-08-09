import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TranslationService } from '../common/translation.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService,
  ) {}

  async findAll(query: QueryProductDto) {
    const where: Record<string, unknown> = {};
    if (query.category) where.category = query.category;
    if (query.publicated !== undefined) where.publicated = query.publicated;

    // FULLTEXT para búsquedas largas (>=4 chars), LIKE para términos cortos
    // innodb_ft_min_token_size=3 por defecto → cubrimos desde 3 chars
    const useFulltext = query.search && query.search.trim().length >= 3;
    if (query.search) {
      if (useFulltext) {
        where.OR = [
          { title: { search: query.search.trim() } },
          { description: { search: query.search.trim() } },
        ];
      } else {
        where.title = { contains: query.search };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: query.skip ?? 0,
        take: query.take ?? 20,
        orderBy: { created: 'desc' },
        // Select específico en vez de include: menos columnas transferidas
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          category: true,
          img: true,
          img1: true,
          img2: true,
          img3: true,
          img4: true,
          img5: true,
          publicated: true,
          created: true,
          dimensions: true,
          space: true,
          circuits: true,
          youtubeUrl: true,
          userId: true,
          user: { select: { id: true, username: true } },
          _count: {
            select: {
              likes: true,
              comments: { where: { isApproved: true } },
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const translatedItems = query.lang
      ? await Promise.all(
          items.map((item) =>
            this.translationService.translateProduct(item, query.lang),
          ),
        )
      : items;

    return {
      items: translatedItems,
      total,
      skip: query.skip ?? 0,
      take: query.take ?? 20,
    };
  }

  async findByCategory(category: string, lang?: 'es' | 'en') {
    const items = await this.prisma.product.findMany({
      where: { category, publicated: true },
      orderBy: { created: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        category: true,
        img: true,
        img1: true,
        publicated: true,
        created: true,
        _count: {
          select: {
            likes: true,
            comments: { where: { isApproved: true } },
          },
        },
      },
    });

    return lang
      ? Promise.all(
          items.map((item) =>
            this.translationService.translateProduct(item, lang),
          ),
        )
      : items;
  }

  async findOne(id: number, lang?: 'es' | 'en') {
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: { select: { id: true, username: true } },
        _count: {
          select: {
            likes: true,
            comments: { where: { isApproved: true } },
          },
        },
      },
    });
    if (!product) {
      throw new NotFoundException(`Producto #${id} no encontrado`);
    }
    return lang
      ? this.translationService.translateProduct(product, lang)
      : product;
  }

  async create(dto: CreateProductDto, userId: number) {
    return this.prisma.product.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        price: dto.price ?? null,
        category: dto.category,
        dimensions: dto.dimensions ?? null,
        space: dto.space ?? null,
        circuits: dto.circuits ?? null,
        youtubeUrl: dto.youtubeUrl ?? null,
        publicated: dto.publicated ?? false,
        img: dto.img ?? 'default_product_image.jpg',
        img1: dto.img1 ?? 'default_product_image.jpg',
        img2: dto.img2 ?? 'default_product_image.jpg',
        img3: dto.img3 ?? 'default_product_image.jpg',
        img4: dto.img4 ?? 'default_product_image.jpg',
        img5: dto.img5 ?? 'default_product_image.jpg',
        userId,
      },
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id: BigInt(id) },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id: BigInt(id) } });
  }
}
