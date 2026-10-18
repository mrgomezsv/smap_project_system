import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Logger,
} from '@nestjs/common';
import { detectContactSpam } from './spam-filter';
import { ContactMessagesService } from './contact-messages.service';
import { Public } from '../auth/decorators/public.decorator';
import { AdminOnly } from '../auth/admin.guard';
import { RateLimit } from '../common/rate-limit.guard';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  contactNumber!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  reason!: string;

  /** Campo trampa anti-bots (oculto en el formulario web). */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  /** Momento (epoch ms) en que se mostró el formulario. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  formStartedAt?: number;
}

class DeleteManyDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  ids!: number[];
}

@Controller('api/web-messages')
@AdminOnly()
export class ContactMessagesController {
  private readonly logger = new Logger(ContactMessagesController.name);

  constructor(private readonly service: ContactMessagesService) {}

  @Public()
  @RateLimit({ limit: 5, windowSec: 600 })
  @Post()
  async create(@Body() dto: CreateContactDto) {
    const spamReason = detectContactSpam(dto);
    if (spamReason) {
      // Respuesta de éxito falsa: el bot no se entera y no ajusta su ataque
      this.logger.warn(`Mensaje de contacto descartado (${spamReason})`);
      return { ok: true };
    }
    const { website: _w, formStartedAt: _f, ...data } = dto;
    return this.service.create(data);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('unread-count')
  unreadCount() {
    return this.service.getUnreadCount();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.service.markAsRead(Number(id));
  }

  @Patch(':id/unread')
  markUnread(@Param('id') id: string) {
    return this.service.markAsUnread(Number(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }

  @Post('delete-multiple')
  removeMany(@Body() dto: DeleteManyDto) {
    return this.service.removeMany(dto.ids);
  }
}
