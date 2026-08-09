import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/clients.dto';

const EMPTY_VALUES: ReadonlySet<string> = new Set(['', 'undefined', 'null']);

function toSentinel(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (EMPTY_VALUES.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

export interface ListClientsParams {
  search?: string;
  skip?: number;
  take?: number;
}

export interface UpsertClientInput {
  email: string;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  cityStateZip?: string | null;
  driverLicense?: string | null;
  userId?: number | null;
  source?: string | null;
  notes?: string | null;
  isActive?: boolean;
  skipEmptyOverwrites?: boolean;
}

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(params: ListClientsParams = {}) {
    const take = Math.min(Math.max(params.take ?? 25, 1), 100);
    const skip = Math.max(params.skip ?? 0, 0);
    const term = params.search?.trim();

    const where: Prisma.ClientWhereInput | undefined = term
      ? {
          OR: [
            { email: { contains: term.toLowerCase() } },
            { name: { contains: term } },
            { phone: { contains: term } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }, { id: 'asc' }],
        skip,
        take,
        include: {
          _count: { select: { rentalContracts: true } },
          user: { select: { id: true, email: true, username: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async findById(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        rentalContracts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            token: true,
            clientName: true,
            clientEmail: true,
            equipment: true,
            eventDate: true,
            status: true,
            price: true,
            deposit: true,
            createdAt: true,
            signedAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Cliente #${id} no encontrado`);
    }

    return client;
  }

  async create(dto: CreateClientDto) {
    const email = this.normalizeEmail(dto.email);

    const existing = await this.prisma.client.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(`Ya existe un cliente con el email ${email}`);
    }

    if (dto.userId !== undefined && dto.userId !== null) {
      await this.assertUserAvailable(dto.userId, null);
    }

    return this.prisma.client.create({
      data: {
        email,
        name: dto.name.trim(),
        phone: toSentinel(dto.phone),
        address: toSentinel(dto.address),
        cityStateZip: toSentinel(dto.cityStateZip),
        driverLicense: toSentinel(dto.driverLicense),
        userId: dto.userId ?? null,
        source: toSentinel(dto.source) ?? 'manual',
        notes: toSentinel(dto.notes),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: number, dto: UpdateClientDto) {
    const existing = await this.prisma.client.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Cliente #${id} no encontrado`);
    }

    const data: Prisma.ClientUpdateInput = {};

    if (dto.email !== undefined) {
      const email = this.normalizeEmail(dto.email);
      if (email !== existing.email) {
        const conflict = await this.prisma.client.findUnique({
          where: { email },
        });
        if (conflict && conflict.id !== id) {
          throw new ConflictException(
            `Ya existe un cliente con el email ${email}`,
          );
        }
        data.email = email;
      }
    }

    if (dto.name !== undefined) data.name = dto.name.trim();

    const setIfPresent = (
      field: keyof Prisma.ClientUpdateInput,
      value: string | null | undefined,
    ) => {
      if (value === undefined) return;
      if (value === null) {
        (data as Record<string, unknown>)[field as string] = null;
        return;
      }
      const trimmed = toSentinel(value);
      if (trimmed === null) return;
      (data as Record<string, unknown>)[field as string] = trimmed;
    };

    setIfPresent('phone', dto.phone);
    setIfPresent('address', dto.address);
    setIfPresent('cityStateZip', dto.cityStateZip);
    setIfPresent('driverLicense', dto.driverLicense);
    setIfPresent('notes', dto.notes);

    if (dto.source !== undefined) {
      const source = toSentinel(dto.source);
      if (source !== null) data.source = source;
    }

    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (dto.userId !== undefined) {
      await this.assertUserAvailable(dto.userId, id);
      data.user =
        dto.userId === null
          ? { disconnect: true }
          : { connect: { id: dto.userId } };
    }

    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async resolveById(id: number) {
    return this.prisma.client.findUnique({ where: { id } });
  }

  async resolveByEmail(email: string) {
    return this.prisma.client.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
  }

  async resolveForContract(input: {
    clientId?: number | null;
    email?: string | null;
    name?: string | null;
  }) {
    if (input.clientId !== undefined && input.clientId !== null) {
      const byId = await this.prisma.client.findUnique({
        where: { id: input.clientId },
      });
      if (!byId) {
        throw new NotFoundException(`Cliente #${input.clientId} no encontrado`);
      }
      return byId;
    }

    const email = this.normalizeOptionalEmail(input.email);
    if (!email) return null;

    const byEmail = await this.prisma.client.findUnique({ where: { email } });
    if (byEmail) return byEmail;

    const name = toSentinel(input.name) ?? email.split('@')[0];
    return this.prisma.client.create({
      data: {
        email,
        name,
        source: 'contract',
        isActive: true,
      },
    });
  }

  async upsertFromAuth(input: UpsertClientInput) {
    const email = this.normalizeEmail(input.email);
    const skipEmpty = input.skipEmptyOverwrites ?? true;

    const existing = await this.prisma.client.findUnique({ where: { email } });
    if (!existing) {
      return this.prisma.client.create({
        data: {
          email,
          name: toSentinel(input.name) ?? email,
          phone: toSentinel(input.phone),
          address: toSentinel(input.address),
          cityStateZip: toSentinel(input.cityStateZip),
          driverLicense: toSentinel(input.driverLicense),
          userId: await this.resolveUserIdForUpsert(input.userId ?? null, null),
          source: toSentinel(input.source) ?? 'auth',
          notes: toSentinel(input.notes),
          isActive: input.isActive ?? true,
        },
      });
    }

    const data: Prisma.ClientUpdateInput = {};

    if (
      input.userId !== undefined &&
      input.userId !== null &&
      input.userId !== existing.userId
    ) {
      const targetUserId = await this.resolveUserIdForUpsert(
        input.userId,
        existing.id,
      );
      if (targetUserId !== existing.userId && targetUserId !== null) {
        data.user = { connect: { id: targetUserId } };
      }
    }

    const setIf = (
      field: keyof Prisma.ClientUpdateInput,
      value: string | null | undefined,
    ) => {
      if (skipEmpty) {
        const trimmed = toSentinel(value);
        if (trimmed === null) return;
        (data as Record<string, unknown>)[field as string] = trimmed;
      } else {
        (data as Record<string, unknown>)[field as string] = toSentinel(value);
      }
    };

    const incomingName = toSentinel(input.name);
    const existingNameIsPlaceholder =
      !existing.name ||
      existing.name.trim() === '' ||
      existing.name === email ||
      existing.name === existing.email;
    if (incomingName && existingNameIsPlaceholder) {
      (data as Record<string, unknown>).name = incomingName;
    }

    setIf('phone', input.phone);
    setIf('address', input.address);
    setIf('cityStateZip', input.cityStateZip);
    setIf('driverLicense', input.driverLicense);
    setIf('notes', input.notes);

    if (input.source !== undefined) {
      const source = toSentinel(input.source);
      if (source !== null) data.source = source;
    }

    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    return this.prisma.client.update({
      where: { id: existing.id },
      data,
    });
  }

  private async resolveUserIdForUpsert(
    desiredUserId: number | null,
    clientId: number | null,
  ): Promise<number | null> {
    if (desiredUserId === null || desiredUserId === undefined) return null;
    const conflict = await this.prisma.client.findFirst({
      where: {
        userId: desiredUserId,
        NOT: clientId ? { id: clientId } : undefined,
      },
      select: { id: true },
    });
    if (conflict) {
      this.logger.warn(
        `User ${desiredUserId} ya está enlazado a Client ${conflict.id}; se omite re-enlace.`,
      );
      return null;
    }
    return desiredUserId;
  }

  private async assertUserAvailable(
    userId: number,
    currentClientId: number | null,
  ): Promise<void> {
    const conflict = await this.prisma.client.findFirst({
      where: {
        userId,
        NOT: currentClientId ? { id: currentClientId } : undefined,
      },
      select: { id: true },
    });
    if (conflict) {
      throw new ConflictException(
        `El usuario #${userId} ya está enlazado al cliente #${conflict.id}`,
      );
    }
  }

  private normalizeEmail(email: string): string {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      throw new ConflictException('El email no puede estar vacío');
    }
    return normalized;
  }

  private normalizeOptionalEmail(
    email: string | null | undefined,
  ): string | null {
    if (!email) return null;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return null;
    return trimmed;
  }
}
