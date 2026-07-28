import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [activeProductsCount, totalEventsCount, waiversTodayCount, unreadMessagesCount] =
      await Promise.all([
        this.prisma.product.count({ where: { publicated: true } }),
        this.prisma.event.count(),
        this.prisma.waiverQRV2.count({ where: { createdAt: { gte: todayStart } } }),
        this.prisma.contactMessage.count(),
      ]);

    // Obtener actividades recientes reales
    const recentWaivers = await this.prisma.waiverQRV2.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        qrCode: true,
        userName: true,
        createdAt: true,
      },
    });

    const recentMessages = await this.prisma.contactMessage.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        reason: true,
        createdAt: true,
      },
    });

    const activity = [
      ...recentWaivers.map((w) => ({
        id: `waiver-${w.id}`,
        type: 'waiver' as const,
        title: 'Nuevo waiver generado',
        description: `QR ${w.qrCode} para ${w.userName}`,
        timestamp: w.createdAt.toISOString(),
      })),
      ...recentMessages.map((m) => ({
        id: `msg-${m.id}`,
        type: 'message' as const,
        title: 'Mensaje de contacto',
        description: `${m.firstName} ${m.lastName}: ${m.reason.slice(0, 45)}...`,
        timestamp: m.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    return {
      stats: {
        activeProducts: activeProductsCount,
        eventsCount: totalEventsCount,
        waiversToday: waiversTodayCount,
        unreadMessages: unreadMessagesCount,
      },
      activity,
    };
  }
}
