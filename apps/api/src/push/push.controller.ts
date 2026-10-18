import { Body, Controller, Post } from '@nestjs/common';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AdminOnly } from '../auth/admin.guard';
import { PushService } from './push.service';
import type { PushSegment } from './push.service';

class SendPushDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  body!: string;

  @IsOptional()
  @IsIn(['all', 'event-attendees'])
  segment?: PushSegment;
}

@Controller('api/push')
@AdminOnly()
export class PushController {
  constructor(private readonly pushService: PushService) {}

  /** POST /api/push/send - Envía una notificación a un segmento (admin). */
  @Post('send')
  send(@Body() dto: SendPushDto) {
    return this.pushService.sendToSegment(
      dto.segment ?? 'all',
      dto.title,
      dto.body,
    );
  }
}
