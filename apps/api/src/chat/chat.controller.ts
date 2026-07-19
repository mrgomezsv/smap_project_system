import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { IsString, IsNotEmpty, MaxLength, IsInt, IsBoolean } from 'class-validator';

class SendMessageDto {
  @IsInt()
  chatRoomId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}

class ToggleAdminDto {
  @IsInt()
  adminId!: number;

  @IsBoolean()
  isActive!: boolean;
}

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  listRooms() {
    return this.chatService.listRooms();
  }

  @Get('rooms/:roomId')
  getRoom(@Param('roomId') roomId: string) {
    return this.chatService.getRoom(Number(roomId));
  }

  @Post('rooms')
  createRoom(@CurrentUser() user: AuthUser) {
    return this.chatService.createRoom(user.userId!);
  }

  @Post('messages')
  sendMessage(@Body() dto: SendMessageDto, @CurrentUser() user: AuthUser) {
    return this.chatService.sendMessage(dto.chatRoomId, user.userId!, dto.content);
  }

  @Post('messages/:id/read')
  markRead(@Param('id') id: string) {
    return this.chatService.markAsRead(Number(id));
  }

  @Get('admins')
  listAdmins() {
    return this.chatService.listAdmins();
  }

  @Post('admins')
  addAdmin(
    @Body() body: { userId: number; email: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.addAdmin(body.userId ?? user.userId!, body.email);
  }

  @Post('admins/toggle')
  toggleAdmin(@Body() dto: ToggleAdminDto) {
    return this.chatService.toggleAdmin(dto.adminId, dto.isActive);
  }
}
