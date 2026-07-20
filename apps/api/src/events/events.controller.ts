import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { EventsService } from './events.service';
import { QueryEventDto } from './dto/query-event.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Cache, CacheInterceptor } from '../common/interceptors/cache.interceptor';

@Controller('api/events')
@UseInterceptors(CacheInterceptor)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Cache(60)
  @Get()
  list(@Query() query: QueryEventDto) {
    return this.eventsService.findAll(query);
  }

  @Public()
  @Cache(60)
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.eventsService.findOne(Number(id));
  }
}
