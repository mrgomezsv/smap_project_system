import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryMetricsDto } from './dto/query-metrics.dto';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(query: QueryMetricsDto) {
    const days = Number.parseInt(query.range ?? '30d', 10);
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - days + 1);
    from.setHours(0, 0, 0, 0);

    const monthlyFrom = new Date(to.getFullYear(), to.getMonth() - 7, 1);
    const limit = Math.min(Math.max(query.topProductsLimit ?? 5, 1), 20);

    const [monthlyWaivers, waivers, likes, comments, products] =
      await Promise.all([
        this.prisma.waiverQRV2.findMany({
          where: { createdAt: { gte: monthlyFrom, lte: to } },
          select: { createdAt: true },
        }),
        this.prisma.waiverQRV2.findMany({
          where: { createdAt: { gte: from, lte: to } },
          select: { createdAt: true, status: true },
        }),
        this.prisma.productLike.findMany({
          where: { createdAt: { gte: from, lte: to } },
          select: { createdAt: true },
        }),
        this.prisma.productComment.findMany({
          where: { createdAt: { gte: from, lte: to } },
          select: { createdAt: true },
        }),
        this.prisma.product.findMany({
          select: {
            id: true,
            title: true,
            category: true,
            publicated: true,
            _count: { select: { likes: true, comments: true } },
          },
        }),
      ]);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      scans,
      scannedWaivers,
      relatives,
      eventsCreated,
      eventsScheduled,
      upcomingEvents,
      eventPartners,
      contactMessages,
      unreadContacts,
      chatMessages,
      unreadChatMessages,
      activeChatRooms,
      categoryGroups,
      publishedProducts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { dateJoined: { gte: from, lte: to } } }),
      this.prisma.waiverScanV2.findMany({
        where: { scannedAt: { gte: from, lte: to } },
        select: { scannedAt: true, waiverQrId: true },
      }),
      this.prisma.waiverQRV2.count({
        where: {
          createdAt: { gte: from, lte: to },
          scans: { some: {} },
        },
      }),
      this.prisma.waiverDataV2.count({
        where: { timestamp: { gte: from, lte: to } },
      }),
      this.prisma.event.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.prisma.event.count({
        where: { startDatetime: { gte: from, lte: to } },
      }),
      this.prisma.event.count({
        where: { published: true, startDatetime: { gte: to } },
      }),
      this.prisma.event.groupBy({
        by: ['partners'],
        where: { startDatetime: { gte: from, lte: to } },
        _count: { _all: true },
      }),
      this.prisma.contactMessage.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { createdAt: true },
      }),
      this.prisma.contactMessage.count({ where: { isRead: false } }),
      this.prisma.chatMessage.findMany({
        where: { timestamp: { gte: from, lte: to } },
        select: { timestamp: true, chatRoomId: true },
      }),
      this.prisma.chatMessage.count({ where: { isRead: false } }),
      this.prisma.chatRoom.count({ where: { isActive: true } }),
      this.prisma.product.groupBy({
        by: ['category'],
        _count: { _all: true },
      }),
      this.prisma.product.count({ where: { publicated: true } }),
    ]);

    const categoryMetrics = categoryGroups
      .map((group) => {
        const categoryProducts = products.filter(
          (product) => product.category === group.category,
        );
        return {
          category: group.category,
          products: group._count._all,
          published: categoryProducts.filter((product) => product.publicated)
            .length,
          interactions: categoryProducts.reduce(
            (sum, product) =>
              sum + product._count.likes + product._count.comments,
            0,
          ),
        };
      })
      .sort((a, b) => b.interactions - a.interactions);

    const scanRate = waivers.length
      ? Math.round((scannedWaivers / waivers.length) * 1000) / 10
      : null;

    const communicationTrend = new Map<
      string,
      { contacts: number; chats: number }
    >();
    for (let index = 0; index < days; index += 1) {
      const date = new Date(from);
      date.setDate(from.getDate() + index);
      communicationTrend.set(this.dayKey(date), { contacts: 0, chats: 0 });
    }
    contactMessages.forEach(({ createdAt }) => {
      const bucket = communicationTrend.get(this.dayKey(createdAt));
      if (bucket) bucket.contacts += 1;
    });
    chatMessages.forEach(({ timestamp }) => {
      const bucket = communicationTrend.get(this.dayKey(timestamp));
      if (bucket) bucket.chats += 1;
    });

    const waiversByMonth = Array.from({ length: 8 }, (_, index) => {
      const date = new Date(to.getFullYear(), to.getMonth() - 7 + index, 1);
      return {
        key: this.monthKey(date),
        month: new Intl.DateTimeFormat('es-ES', { month: 'short' })
          .format(date)
          .replace('.', ''),
        waivers: 0,
      };
    });
    const monthMap = new Map(waiversByMonth.map((item) => [item.key, item]));
    monthlyWaivers.forEach(({ createdAt }) => {
      const bucket = monthMap.get(this.monthKey(createdAt));
      if (bucket) bucket.waivers += 1;
    });

    const trendMap = new Map<
      string,
      { likes: number; comments: number; waivers: number }
    >();
    for (let index = 0; index < days; index += 1) {
      const date = new Date(from);
      date.setDate(from.getDate() + index);
      trendMap.set(this.dayKey(date), { likes: 0, comments: 0, waivers: 0 });
    }
    likes.forEach(({ createdAt }) => {
      const bucket = trendMap.get(this.dayKey(createdAt));
      if (bucket) bucket.likes += 1;
    });
    comments.forEach(({ createdAt }) => {
      const bucket = trendMap.get(this.dayKey(createdAt));
      if (bucket) bucket.comments += 1;
    });
    waivers.forEach(({ createdAt }) => {
      const bucket = trendMap.get(this.dayKey(createdAt));
      if (bucket) bucket.waivers += 1;
    });

    const statusCounts = waivers.reduce<Record<string, number>>(
      (counts, waiver) => {
        counts[waiver.status] = (counts[waiver.status] ?? 0) + 1;
        return counts;
      },
      {},
    );
    const statusColors = [
      '#1e3a8a',
      '#10b981',
      '#f5a91b',
      '#ef4444',
      '#64748b',
    ];

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      waiversByMonth: waiversByMonth.map(({ month, waivers: count }) => ({
        month,
        waivers: count,
      })),
      topProducts: products
        .map((product) => ({
          id: product.id.toString(),
          name: product.title,
          interactions: product._count.likes + product._count.comments,
        }))
        .sort((a, b) => b.interactions - a.interactions)
        .slice(0, limit),
      waiverStatuses: Object.entries(statusCounts).map(
        ([name, value], index) => ({
          name,
          value,
          color: statusColors[index % statusColors.length],
        }),
      ),
      trend: Array.from(trendMap.entries()).map(([date, values]) => ({
        date,
        label: new Intl.DateTimeFormat('es-ES', {
          day: '2-digit',
          month: 'short',
        })
          .format(new Date(`${date}T12:00:00`))
          .replace('.', ''),
        ...values,
      })),
      totals: {
        waivers: waivers.length,
        likes: likes.length,
        comments: comments.length,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        newInRange: newUsers,
      },
      waiverOperations: {
        scans: scans.length,
        uniqueScanned: new Set(scans.map((scan) => scan.waiverQrId.toString()))
          .size,
        relatives,
        scanRate,
      },
      events: {
        created: eventsCreated,
        scheduled: eventsScheduled,
        upcomingPublished: upcomingEvents,
        byPartner: eventPartners.map((partner) => ({
          name: partner.partners,
          events: partner._count._all,
        })),
      },
      communications: {
        contacts: contactMessages.length,
        unreadContacts,
        chatMessages: chatMessages.length,
        unreadChatMessages,
        activeChatRooms,
        uniqueChatRooms: new Set(
          chatMessages.map((message) => message.chatRoomId),
        ).size,
        trend: Array.from(communicationTrend.entries()).map(
          ([date, values]) => ({
            date,
            label: this.dateLabel(date),
            ...values,
          }),
        ),
      },
      catalog: {
        totalProducts: products.length,
        publishedProducts,
        categories: categoryMetrics,
      },
    };
  }

  private dateLabel(date: string) {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
    })
      .format(new Date(`${date}T12:00:00`))
      .replace('.', '');
  }

  private dayKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
