import { Body, Controller, Post } from '@nestjs/common';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AdminOnly } from '../auth/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
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

class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  token!: string;

  @IsOptional()
  @IsIn(['android', 'ios', 'web'])
  platform?: string;
}

@Controller('api/push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  /** POST /api/push/register-token - Registra el token FCM del dispositivo. */
  @Post('register-token')
  register(@Body() dto: RegisterTokenDto, @CurrentUser() user: AuthUser) {
    return this.pushService.registerToken(
      user.uid,
      dto.token,
      dto.platform ?? 'web',
    );
  }

  /** POST /api/push/send - Envía una notificación a un segmento (admin). */
  @AdminOnly()
  @Post('send')
  send(@Body() dto: SendPushDto) {
    return this.pushService.sendToSegment(
      dto.segment ?? 'all',
      dto.title,
      dto.body,
    );
  }
}
