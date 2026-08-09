import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ContactMessagesService } from './contact-messages.service';
import { Public } from '../auth/decorators/public.decorator';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
  IsInt,
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
}

class DeleteManyDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  ids!: number[];
}

@Controller('api/web-messages')
export class ContactMessagesController {
  constructor(private readonly service: ContactMessagesService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.service.create(dto);
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
