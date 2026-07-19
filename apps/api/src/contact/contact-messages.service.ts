import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const msg = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) throw new NotFoundException(`Mensaje #${id} no encontrado`);
    return msg;
  }

  async create(data: {
    firstName: string;
    lastName: string;
    contactNumber: string;
    email: string;
    reason: string;
  }) {
    return this.prisma.contactMessage.create({ data });
  }

  async markAsRead(id: number) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAsUnread(id: number) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead: false },
    });
  }

  async remove(id: number) {
    return this.prisma.contactMessage.delete({ where: { id } });
  }

  async removeMany(ids: number[]) {
    return this.prisma.contactMessage.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async getUnreadCount() {
    return this.prisma.contactMessage.count({ where: { isRead: false } });
  }
}
