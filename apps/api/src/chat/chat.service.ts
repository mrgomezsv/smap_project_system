import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // === Chat Rooms ===

  async listRooms() {
    return this.prisma.chatRoom.findMany({
      orderBy: { lastMessageAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, email: true } },
        messages: { orderBy: { timestamp: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    });
  }

  async getRoom(
    roomId: number,
    opts: { take?: number; skip?: number; cursor?: number } = {},
  ) {
    const take = Math.min(opts.take ?? 50, 100);
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        user: { select: { id: true, username: true, email: true } },
        messages: {
          orderBy: { timestamp: 'desc' }, // más recientes primero (mejor para cursor pagination)
          take,
          skip: opts.skip,
          ...(opts.cursor && { cursor: { id: opts.cursor } }),
        },
      },
    });
    if (!room) throw new NotFoundException(`Chat room #${roomId} no encontrado`);
    // Invertir para que se devuelvan en orden cronológico ascendente
    if (room.messages) {
      room.messages = room.messages.reverse();
    }
    return room;
  }

  async createRoom(userId: number) {
    return this.prisma.chatRoom.create({
      data: { userId, isActive: true },
    });
  }

  // === Chat Messages ===

  async sendMessage(roomId: number, senderId: number, content: string) {
    const room = await this.prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException(`Chat room #${roomId} no encontrado`);

    const message = await this.prisma.chatMessage.create({
      data: { chatRoomId: roomId, senderId, content },
    });

    // Actualizar lastMessageAt del room
    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async markAsRead(messageId: number) {
    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  // === Administrators ===

  async listAdmins() {
    return this.prisma.chatAdministrator.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
  }

  async addAdmin(userId: number, email: string) {
    return this.prisma.chatAdministrator.create({
      data: { userId, email },
    });
  }

  async toggleAdmin(adminId: number, isActive: boolean) {
    return this.prisma.chatAdministrator.update({
      where: { id: adminId },
      data: { isActive },
    });
  }
}
