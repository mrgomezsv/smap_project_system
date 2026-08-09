import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import {
  CreateClientDto,
  QueryClientsDto,
  UpdateClientDto,
  UpdateMyClientDto,
} from './dto/clients.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { assertAdminEmail } from '../auth/admin-allowlist';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v2/clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const profile = await this.resolveOwnClient(user);
    return this.clientsService.findById(profile.id);
  }

  @Patch('me')
  async patchMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMyClientDto) {
    const profile = await this.resolveOwnClient(user);
    return this.clientsService.update(profile.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: QueryClientsDto) {
    assertAdminEmail(user.email);
    return this.clientsService.list(query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    assertAdminEmail(user.email);
    return this.clientsService.findById(id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateClientDto) {
    assertAdminEmail(user.email);
    return this.clientsService.create(dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
  ) {
    assertAdminEmail(user.email);
    return this.clientsService.update(id, dto);
  }

  private async resolveOwnClient(user: AuthUser) {
    if (!user.email && !user.userId) {
      throw new BadRequestException('Sesión inválida: sin email ni userId.');
    }
    let profile = user.userId
      ? await this.prisma.client.findFirst({ where: { userId: user.userId } })
      : null;
    if (!profile && user.email) {
      profile = await this.prisma.client.findUnique({
        where: { email: user.email.toLowerCase() },
      });
    }
    if (!profile) {
      throw new NotFoundException(
        'Tu cuenta no tiene un perfil de cliente editable.',
      );
    }
    return profile;
  }
}
