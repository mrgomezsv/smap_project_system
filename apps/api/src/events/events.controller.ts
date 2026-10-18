import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { QueryEventDto } from './dto/query-event.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Public } from '../auth/decorators/public.decorator';
import { AdminOnly } from '../auth/admin.guard';
import { isAdminUser } from '../auth/admin-allowlist';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import {
  Cache,
  CacheInterceptor,
  SkipCache,
  CacheInvalidate,
} from '../common/interceptors/cache.interceptor';

@Controller('api/events')
@UseInterceptors(CacheInterceptor)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Cache(60)
  @Get()
  list(@Query() query: QueryEventDto, @CurrentUser() user?: AuthUser) {
    // Solo los admins pueden listar eventos no publicados
    if (!isAdminUser(user)) query.published = true;
    return this.eventsService.findAll(query);
  }

  @Public()
  @Cache(60)
  @Get('organizers')
  organizers() {
    return this.eventsService.getOrganizers();
  }

  @Public()
  @Cache(60)
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.eventsService.findOne(Number(id));
  }

  @AdminOnly()
  @SkipCache()
  @CacheInvalidate('/api/events*')
  @Post()
  create(@Body() dto: CreateEventDto, @CurrentUser() user?: AuthUser) {
    return this.eventsService.create(dto, user?.userId);
  }

  @AdminOnly()
  @SkipCache()
  @CacheInvalidate('/api/events*')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(Number(id), dto);
  }

  @AdminOnly()
  @SkipCache()
  @CacheInvalidate('/api/events*')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(Number(id));
  }
}

