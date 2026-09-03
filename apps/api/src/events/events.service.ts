import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryEventDto } from './dto/query-event.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryEventDto) {
    const where: Record<string, unknown> = {};
    if (query.published !== undefined) where.published = query.published;
    if (query.partners) where.partners = query.partners;
    if (query.search) {
      const term = query.search.trim();
      if (term.length >= 3) {
        where.OR = [
          { title: { search: term } },
          { description: { search: term } },
        ];
      } else {
        where.title = { contains: term };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip: query.skip ?? 0,
        take: query.take ?? 20,
        orderBy: { startDatetime: 'asc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return { items, total, skip: query.skip ?? 0, take: query.take ?? 20 };
  }

  async findOne(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(id) },
      include: {
        organizer: { select: { id: true, username: true } },
      },
    });
    if (!event) {
      throw new NotFoundException(`Evento #${id} no encontrado`);
    }
    return event;
  }

  async create(dto: CreateEventDto, organizerId?: number) {
    const slug = dto.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200);

    const safeSlug = `${slug}-${Date.now().toString(36)}`;

    let orgId = organizerId;
    if (!orgId) {
      const firstUser = await this.prisma.user.findFirst({ select: { id: true } });
      orgId = firstUser?.id ?? 1;
    }

    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startDatetime: new Date(dto.startDatetime),
        ticketPrice: dto.ticketPrice ?? 0,
        partners: dto.partners ?? 'partner1',
        published: dto.published ?? false,
        image: dto.image || null,
        slug: safeSlug,
        organizerId: orgId,
      },
    });
  }

  async update(id: number, dto: UpdateEventDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.startDatetime !== undefined) data.startDatetime = new Date(dto.startDatetime);
    if (dto.ticketPrice !== undefined) data.ticketPrice = dto.ticketPrice;
    if (dto.partners !== undefined) data.partners = dto.partners;
    if (dto.published !== undefined) data.published = dto.published;
    if (dto.image !== undefined) data.image = dto.image;

    return this.prisma.event.update({
      where: { id: BigInt(id) },
      data,
    });
  }

  async getOrganizers() {
    const events = await this.prisma.event.findMany({
      select: { partners: true },
      distinct: ['partners'],
    });
    const dbOrganizers = events
      .map((e) => e.partners)
      .filter((p): p is string => Boolean(p && p.trim()));

    const defaults = ['partner1', 'partner2', 'partner3', 'Kidsfun', 'Tecun Productions'];
    return Array.from(new Set([...defaults, ...dbOrganizers]));
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.event.delete({
      where: { id: BigInt(id) },
    });
  }
}
