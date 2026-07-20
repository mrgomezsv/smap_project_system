import { Controller, Get, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { QueryEventDto } from './dto/query-event.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get()
  list(@Query() query: QueryEventDto) {
    return this.eventsService.findAll(query);
  }
}
