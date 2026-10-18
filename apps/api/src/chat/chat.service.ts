import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Quién realiza la acción: los no-admin solo acceden a su propio room. */
export interface ChatActor {
  userId: number;
  isAdmin: boolean;
}

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
        _count: { select: { messages: { where: { isRead: false } } } },
      },
    });
  }

  async getRoom(
    roomId: number,
    opts: { take?: number; skip?: number; cursor?: number } = {},
    actor?: ChatActor,
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
    if (!room)
      throw new NotFoundException(`Chat room #${roomId} no encontrado`);
    this.assertCanAccess(room.userId, actor);
    // Invertir para que se devuelvan en orden cronológico ascendente
    if (room.messages) {
      room.messages = room.messages.reverse();
    }
    return room;
  }

  /** Devuelve el room activo del usuario o crea uno nuevo. */
  async createRoom(userId: number) {
    const existing = await this.prisma.chatRoom.findFirst({
      where: { userId, isActive: true },
      orderBy: { lastMessageAt: 'desc' },
    });
    if (existing) return existing;
    return this.prisma.chatRoom.create({
      data: { userId, isActive: true },
    });
  }

  /** Room del usuario con ese email (lo crea si no existe). */
  async roomForEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(
        'Ese usuario aún no ha iniciado sesión en la plataforma',
      );
    }
    return this.createRoom(user.id);
  }

  // === Chat Messages ===

  async sendMessage(
    roomId: number,
    senderId: number,
    content: string,
    actor?: ChatActor,
  ) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!room)
      throw new NotFoundException(`Chat room #${roomId} no encontrado`);
    this.assertCanAccess(room.userId, actor);

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: { chatRoomId: roomId, senderId, content },
      }),
      this.prisma.chatRoom.update({
        where: { id: roomId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }

  async markAsRead(messageId: number, actor?: ChatActor) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { chatRoom: { select: { userId: true } } },
    });
    if (!message)
      throw new NotFoundException(`Mensaje #${messageId} no encontrado`);
    this.assertCanAccess(message.chatRoom.userId, actor);
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

  private assertCanAccess(roomOwnerId: number, actor?: ChatActor) {
    if (!actor || actor.isAdmin) return;
    if (actor.userId !== roomOwnerId) {
      throw new ForbiddenException('No tienes acceso a esta conversación');
    }
  }
}
