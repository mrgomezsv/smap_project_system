import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryEventDto } from './dto/query-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryEventDto) {
    const where: Record<string, unknown> = {};
    if (query.published !== undefined) where.published = query.published;
    if (query.partners) where.partners = query.partners;
    if (query.search) {
      where.title = { contains: query.search };
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
}
