import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { AdminOnly } from '../auth/admin.guard';
import { isAdminEmail } from '../auth/admin-allowlist';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsInt,
  IsBoolean,
  IsEmail,
  IsOptional,
} from 'class-validator';

class SendMessageDto {
  @IsInt()
  chatRoomId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}

class AddAdminDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsEmail()
  email!: string;
}

class ToggleAdminDto {
  @IsInt()
  adminId!: number;

  @IsBoolean()
  isActive!: boolean;
}

function isAdmin(user: AuthUser): boolean {
  return user.emailVerified === true && isAdminEmail(user.email);
}

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @AdminOnly()
  @Get('rooms')
  listRooms() {
    return this.chatService.listRooms();
  }

  @Get('rooms/:roomId')
  getRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.getRoom(roomId, {}, this.actor(user));
  }

  @Post('rooms')
  createRoom(@CurrentUser() user: AuthUser) {
    return this.chatService.createRoom(user.userId!);
  }

  @Post('messages')
  sendMessage(@Body() dto: SendMessageDto, @CurrentUser() user: AuthUser) {
    return this.chatService.sendMessage(
      dto.chatRoomId,
      user.userId!,
      dto.content,
      this.actor(user),
    );
  }

  @Post('messages/:id/read')
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.markAsRead(id, this.actor(user));
  }

  @AdminOnly()
  @Get('admins')
  listAdmins() {
    return this.chatService.listAdmins();
  }

  @AdminOnly()
  @Post('admins')
  addAdmin(@Body() body: AddAdminDto, @CurrentUser() user: AuthUser) {
    return this.chatService.addAdmin(body.userId ?? user.userId!, body.email);
  }

  @AdminOnly()
  @Post('admins/toggle')
  toggleAdmin(@Body() dto: ToggleAdminDto) {
    return this.chatService.toggleAdmin(dto.adminId, dto.isActive);
  }

  private actor(user: AuthUser) {
    return { userId: user.userId ?? -1, isAdmin: isAdmin(user) };
  }
}
