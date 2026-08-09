import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryMetricsDto } from './dto/query-metrics.dto';

type DailyAggRow = {
  day: Date;
  status: string | null;
  count: bigint;
};

type CountRow = { count: bigint };
type GroupRow = { name: string; count: bigint };

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

    // ============ AGREGACIONES SQL (antes: 17 queries + bucket en JS) ============
    const [
      monthlyWaivers,
      dailyWaiversAgg,
      dailyLikesAgg,
      dailyCommentsAgg,
      dailyContactMessagesAgg,
      dailyChatMessagesAgg,
      totalUsers,
      activeUsers,
      newUsers,
      scanStats,
      relativesCount,
      eventsCreated,
      eventsScheduled,
      upcomingEvents,
      eventPartners,
      unreadContacts,
      unreadChatMessages,
      activeChatRooms,
      categoryGroups,
      publishedProducts,
    ] = await Promise.all([
      this.aggregateMonthlyWaivers(monthlyFrom),
      this.aggregateDailyWaivers(from, to),
      this.aggregateDaily('t_app_product_like', 'created_at', from, to),
      this.aggregateDaily('t_app_product_comment', 'created_at', from, to),
      this.aggregateDaily('t_app_contact_message', 'created_at', from, to),
      this.aggregateDaily('t_app_chat_message', 'timestamp', from, to),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { dateJoined: { gte: from, lte: to } } }),
      this.prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) as count FROM waiver_v2_waiverscan
        WHERE scanned_at BETWEEN ${from} AND ${to}
      `.then((rows) => Number(rows[0]?.count ?? 0)),
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
      this.prisma.contactMessage.count({ where: { isRead: false } }),
      this.prisma.chatMessage.count({ where: { isRead: false } }),
      this.prisma.chatRoom.count({ where: { isActive: true } }),
      this.prisma.product.groupBy({
        by: ['category'],
        _count: { _all: true },
      }),
      this.prisma.product.count({ where: { publicated: true } }),
    ]);

    // Top productos (con likes + comments count desde SQL)
    const topProducts = await this.prisma.$queryRaw<
      Array<{ id: bigint; title: string; interactions: bigint }>
    >`
      SELECT
        p.id,
        p.title,
        (COALESCE(l.like_count, 0) + COALESCE(c.comment_count, 0)) as interactions
      FROM t_app_product_product p
      LEFT JOIN (
        SELECT product_id, COUNT(*) as like_count
        FROM t_app_product_like
        GROUP BY product_id
      ) l ON l.product_id = p.id
      LEFT JOIN (
        SELECT product_id, COUNT(*) as comment_count
        FROM t_app_product_comment
        GROUP BY product_id
      ) c ON c.product_id = p.id
      ORDER BY interactions DESC
      LIMIT ${limit}
    `;

    // Category metrics: combinamos counts por categoría
    const categoryInteractions = await this.prisma.$queryRaw<
      Array<{ category: string; likes: bigint; comments: bigint }>
    >`
      SELECT
        p.category,
        COALESCE(l.like_count, 0) as likes,
        COALESCE(c.comment_count, 0) as comments
      FROM (
        SELECT DISTINCT category FROM t_app_product_product
      ) p
      LEFT JOIN (
        SELECT pr.category, COUNT(*) as like_count
        FROM t_app_product_like pl
        JOIN t_app_product_product pr ON pr.id = pl.product_id
        GROUP BY pr.category
      ) l ON l.category = p.category
      LEFT JOIN (
        SELECT pr.category, COUNT(*) as comment_count
        FROM t_app_product_comment pc
        JOIN t_app_product_product pr ON pr.id = pc.product_id
        GROUP BY pr.category
      ) c ON c.category = p.category
    `;

    // ============ Bucket construction (era JS-heavy, ahora menor) ============
    const trendMap = new Map<string, { likes: number; comments: number; waivers: number }>();
    const communicationTrend = new Map<string, { contacts: number; chats: number }>();

    for (let i = 0; i < days; i++) {
      const date = new Date(from);
      date.setDate(from.getDate() + i);
      const key = this.dayKey(date);
      trendMap.set(key, { likes: 0, comments: 0, waivers: 0 });
      communicationTrend.set(key, { contacts: 0, chats: 0 });
    }

    dailyLikesAgg.forEach(({ day, count }) => {
      const bucket = trendMap.get(this.dayKey(new Date(day)));
      if (bucket) bucket.likes += Number(count);
    });
    dailyCommentsAgg.forEach(({ day, count }) => {
      const bucket = trendMap.get(this.dayKey(new Date(day)));
      if (bucket) bucket.comments += Number(count);
    });
    dailyWaiversAgg.forEach(({ day, count }) => {
      const bucket = trendMap.get(this.dayKey(new Date(day)));
      if (bucket) bucket.waivers += Number(count);
    });

    dailyContactMessagesAgg.forEach(({ day, count }) => {
      const bucket = communicationTrend.get(this.dayKey(new Date(day)));
      if (bucket) bucket.contacts += Number(count);
    });
    dailyChatMessagesAgg.forEach(({ day, count }) => {
      const bucket = communicationTrend.get(this.dayKey(new Date(day)));
      if (bucket) bucket.chats += Number(count);
    });

    // Monthly waivers bucket (8 months)
    const waiversByMonth = Array.from({ length: 8 }, (_, i) => {
      const date = new Date(to.getFullYear(), to.getMonth() - 7 + i, 1);
      return {
        key: this.monthKey(date),
        month: new Intl.DateTimeFormat('es-ES', { month: 'short' })
          .format(date)
          .replace('.', ''),
        waivers: 0,
      };
    });
    const monthMap = new Map(waiversByMonth.map((m) => [m.key, m]));
    monthlyWaivers.forEach(({ day, count }) => {
      const bucket = monthMap.get(this.monthKey(new Date(day)));
      if (bucket) bucket.waivers += Number(count);
    });

    // Status distribution
    const statusCounts: Record<string, number> = {};
    dailyWaiversAgg.forEach(({ status, count }) => {
      const key = status ?? 'UNKNOWN';
      statusCounts[key] = (statusCounts[key] ?? 0) + Number(count);
    });

    const statusColors = ['#1e3a8a', '#10b981', '#f5a91b', '#ef4444', '#64748b'];

    // Unique scanned waivers en rango (count distinct waiver_qr_id)
    const uniqueScannedResult = await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT waiver_qr_id) as count
      FROM waiver_v2_waiverscan
      WHERE scanned_at BETWEEN ${from} AND ${to}
    `;
    const uniqueScanned = Number(uniqueScannedResult[0]?.count ?? 0);

    const totalWaiversInRange = dailyWaiversAgg.reduce(
      (sum, r) => sum + Number(r.count),
      0,
    );

    const scanRate = totalWaiversInRange
      ? Math.round((uniqueScanned / totalWaiversInRange) * 1000) / 10
      : null;

    // Unique chat rooms en rango
    const uniqueChatRoomsResult = await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT chat_room_id) as count
      FROM t_app_chat_message
      WHERE timestamp BETWEEN ${from} AND ${to}
    `;
    const uniqueChatRooms = Number(uniqueChatRoomsResult[0]?.count ?? 0);

    // Category metrics armado desde SQL aggregations
    const categoryMetrics = categoryGroups
      .map((group) => {
        const interactions = categoryInteractions.find(
          (ci) => ci.category === group.category,
        );
        return {
          category: group.category,
          products: group._count._all,
          interactions: interactions
            ? Number(interactions.likes) + Number(interactions.comments)
            : 0,
        };
      })
      .sort((a, b) => b.interactions - a.interactions);

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      waiversByMonth: waiversByMonth.map(({ month, waivers: count }) => ({
        month,
        waivers: count,
      })),
      topProducts: topProducts.map((p) => ({
        id: p.id.toString(),
        name: p.title,
        interactions: Number(p.interactions),
      })),
      waiverStatuses: Object.entries(statusCounts).map(
        ([name, value], index) => ({
          name,
          value,
          color: statusColors[index % statusColors.length],
        }),
      ),
      trend: Array.from(trendMap.entries()).map(([date, values]) => ({
        date,
        label: this.dateLabel(date),
        ...values,
      })),
      totals: {
        waivers: totalWaiversInRange,
        likes: dailyLikesAgg.reduce((sum, r) => sum + Number(r.count), 0),
        comments: dailyCommentsAgg.reduce((sum, r) => sum + Number(r.count), 0),
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        newInRange: newUsers,
      },
      waiverOperations: {
        scans: scanStats,
        uniqueScanned,
        relatives: relativesCount,
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
        contacts: dailyContactMessagesAgg.reduce(
          (sum, r) => sum + Number(r.count),
          0,
        ),
        unreadContacts,
        chatMessages: dailyChatMessagesAgg.reduce(
          (sum, r) => sum + Number(r.count),
          0,
        ),
        unreadChatMessages,
        activeChatRooms,
        uniqueChatRooms,
        trend: Array.from(communicationTrend.entries()).map(
          ([date, values]) => ({
            date,
            label: this.dateLabel(date),
            ...values,
          }),
        ),
      },
      catalog: {
        totalProducts: categoryGroups.reduce(
          (sum, g) => sum + g._count._all,
          0,
        ),
        publishedProducts,
        categories: categoryMetrics,
      },
    };
  }

  /**
   * Aggregate waivers by day in range (with status).
   */
  private async aggregateDailyWaivers(
    from: Date,
    to: Date,
  ): Promise<DailyAggRow[]> {
    return this.prisma.$queryRaw<DailyAggRow[]>`
      SELECT
        DATE(created_at) as day,
        status,
        COUNT(*) as count
      FROM waiver_v2_waiverqr
      WHERE created_at BETWEEN ${from} AND ${to}
      GROUP BY DATE(created_at), status
    `;
  }

  /**
   * Aggregate waivers by month.
   */
  private async aggregateMonthlyWaivers(
    from: Date,
  ): Promise<Array<{ day: Date; count: bigint }>> {
    return this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m-01') as day,
        COUNT(*) as count
      FROM waiver_v2_waiverqr
      WHERE created_at >= ${from}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-01')
    `;
  }

  /**
   * Generic daily aggregation for any timestamp column.
   */
  private async aggregateDaily(
    table: string,
    column: string,
    from: Date,
    to: Date,
  ): Promise<Array<{ day: Date; count: bigint }>> {
    // Whitelist para evitar SQL injection
    const safeColumns: Record<string, string> = {
      't_app_product_like.created_at': 't_app_product_like',
      't_app_product_comment.created_at': 't_app_product_comment',
      't_app_contact_message.created_at': 't_app_contact_message',
      't_app_chat_message.timestamp': 't_app_chat_message',
    };
    const key = `${table}.${column}`;
    if (!safeColumns[key]) {
      throw new Error(`aggregateDaily: tabla/columna no permitida: ${key}`);
    }
    return this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
      SELECT DATE(${Prisma.raw(column)}) as day, COUNT(*) as count
      FROM ${Prisma.raw(safeColumns[key])}
      WHERE ${Prisma.raw(column)} BETWEEN ${from} AND ${to}
      GROUP BY DATE(${Prisma.raw(column)})
    `;
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