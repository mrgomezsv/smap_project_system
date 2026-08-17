import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const DEFAULT_CATEGORIES = [
  { slug: 'option1', nameEs: 'Brincolines', nameEn: 'Bounce Houses', emoji: '🎪', color: 'from-party-pink/20 to-brand-yellow/20', position: 1 },
  { slug: 'option2', nameEs: 'Juegos Eléctricos', nameEn: 'Electric Games', emoji: '⚡', color: 'from-primary/20 to-info/20', position: 2 },
  { slug: 'option3', nameEs: 'Mobiliario', nameEn: 'Furniture', emoji: '🪑', color: 'from-brand-yellow/20 to-party-pink/20', position: 3 },
  { slug: 'option4', nameEs: 'Máquinas de Concesión', nameEn: 'Concession Machines', emoji: '🍿', color: 'from-warning/20 to-brand-yellow/20', position: 4 },
  { slug: 'option5', nameEs: 'Juegos Competitivos', nameEn: 'Competitive Games', emoji: '🏆', color: 'from-info/20 to-success/20', position: 5 },
  { slug: 'option6', nameEs: 'Equipos en Alquiler', nameEn: 'Equipment Rental', emoji: '🎁', color: 'from-primary/20 to-party-pink/20', position: 6 },
  { slug: 'option7', nameEs: 'Juegos de Agua', nameEn: 'Water Fun for Rent', emoji: '💦', color: 'from-success/20 to-info/20', position: 7 },
  { slug: 'toros_mecanicos', nameEs: 'Toros Mecánicos', nameEn: 'Mechanical Bulls', emoji: '🐂', color: 'from-warning/20 to-primary/20', position: 8 },
  { slug: 'trenes_electricos', nameEs: 'Trenes Eléctricos', nameEn: 'Electric Trains', emoji: '🚂', color: 'from-info/20 to-brand-yellow/20', position: 9 },
  { slug: 'kiddie_ride', nameEs: 'Kiddie Ride', nameEn: 'Kiddie Ride', emoji: '🎠', color: 'from-party-pink/20 to-info/20', position: 10 },
  { slug: 'maquina_espuma', nameEs: 'Máquina de Espuma', nameEn: 'Foam Machine', emoji: '🫧', color: 'from-info/20 to-success/20', position: 11 },
  { slug: 'game_trailer', nameEs: 'Game Trailer', nameEn: 'Game Trailer', emoji: '🎮', color: 'from-primary/20 to-warning/20', position: 12 },
  { slug: 'robots_led', nameEs: 'Robots LED', nameEn: 'LED Robots', emoji: '🤖', color: 'from-brand-yellow/20 to-primary/20', position: 13 },
  { slug: 'shots_carts', nameEs: 'Shots Carts', nameEn: 'Shots Carts', emoji: '🍹', color: 'from-party-pink/20 to-warning/20', position: 14 },
  { slug: 'obstacle_course', nameEs: 'Obstacle Course', nameEn: 'Obstacle Course', emoji: '🏃', color: 'from-warning/20 to-success/20', position: 15 },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.category.count();
      if (count === 0) {
        console.log('🌱 Inicializando categorías predeterminadas en BD...');
        for (const cat of DEFAULT_CATEGORIES) {
          await this.prisma.category.create({
            data: cat,
          });
        }
        console.log('✅ Categorías predeterminadas sembradas con éxito.');
      }
    } catch (e) {
      console.error('⚠️ No se pudo verificar/sembrar categorías iniciales:', e);
    }
  }

  async findAllActive(lang?: 'es' | 'en') {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });

    return categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: lang === 'en' && cat.nameEn ? cat.nameEn : cat.nameEs,
      nameEs: cat.nameEs,
      nameEn: cat.nameEn,
      emoji: cat.emoji,
      color: cat.color,
      position: cat.position,
      isActive: cat.isActive,
    }));
  }

  async findAllAdmin() {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });

    const counts = await this.prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    const countMap = new Map<string, number>();
    counts.forEach((c) => countMap.set(c.category, c._count.id));

    return categories.map((cat) => ({
      ...cat,
      productCount: countMap.get(cat.slug) ?? 0,
    }));
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Categoría #${id} no encontrada`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Ya existe una categoría con el slug "${dto.slug}"`);
    }

    return this.prisma.category.create({
      data: {
        slug: dto.slug,
        nameEs: dto.nameEs,
        nameEn: dto.nameEn ?? dto.nameEs,
        emoji: dto.emoji ?? '🎪',
        color: dto.color ?? 'from-primary/20 to-party-pink/20',
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.slug) {
      const existing = await this.prisma.category.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Ya existe otra categoría con el slug "${dto.slug}"`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    const productCount = await this.prisma.product.count({
      where: { category: category.slug },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la categoría "${category.nameEs}" porque tiene ${productCount} producto(s) asignado(s). Cambia de categoría a los productos antes de eliminar.`
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
