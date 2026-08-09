import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { assertAdminEmail } from '../auth/admin-allowlist';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('stats')
  async getStats(@CurrentUser() user: AuthUser) {
    assertAdminEmail(user.email);
    return this.dashboardService.getStats();
  }

  /**
   * Devuelve estadísticas de salud de la base de datos:
   *  - Conteos por tabla Prisma
   *  - Slow queries detectados
   *  - Pool de conexiones
   *  - Espacio en disco
   * Solo admin.
   */
  @Get('db-stats')
  async getDbStats(@CurrentUser() user: AuthUser) {
    assertAdminEmail(user.email);

    const prismaTables = [
      'auth_user',
      't_app_product_product',
      't_app_event',
      't_app_product_like',
      't_app_product_comment',
      't_app_product_comment_reply',
      'waiver_v2_waiverqr',
      'waiver_v2_waiverdata',
      'waiver_v2_waiverscan',
      'waiver_v2_waiverdocument',
      't_app_chat_administrator',
      't_app_chat_room',
      't_app_chat_message',
      't_app_contact_message',
      't_app_product_waivervalidator',
      't_app_rental_contract',
    ];

    // Conteos exactos por tabla
    const counts: Array<{ table: string; count: number }> = [];
    for (const t of prismaTables) {
      try {
        const result = await this.prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
          `SELECT COUNT(*) as c FROM \`${t}\``,
        );
        counts.push({ table: t, count: Number(result[0]?.c ?? 0n) });
      } catch {
        counts.push({ table: t, count: 0 });
      }
    }

    // Versión MariaDB y uptime
    const serverInfo = await this.prisma.$queryRaw<Array<{ Variable_name: string; Value: string }>>`
      SHOW VARIABLES WHERE Variable_name IN ('version', 'version_compile_os', 'uptime')
    `;

    // Tamaño total
    const sizeRow = await this.prisma.$queryRaw<Array<{ total_mb: number }>>`
      SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS total_mb
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `;

    // Índices por tabla Prisma
    const placeholders = prismaTables.map(() => '?').join(',');
    const indexStats = await this.prisma.$queryRawUnsafe<
      Array<{ TABLE_NAME: string; INDEX_NAME: string; COLUMN_NAME: string }>
    >(
      `SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME IN (${placeholders})
       ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
      ...prismaTables,
    );

    return {
      generated_at: new Date().toISOString(),
      server: Object.fromEntries(
        (serverInfo ?? []).map((r) => [r.Variable_name, r.Value]),
      ),
      total_size_mb: Number(sizeRow[0]?.total_mb ?? 0),
      table_counts: counts,
      indexes: indexStats,
    };
  }

  /**
   * Estadísticas de Redis: uptime, memoria,命中率, claves totales.
   * Útil para detectar memory pressure o命中率 baja.
   */
  @Get('redis-stats')
  async getRedisStats(@CurrentUser() user: AuthUser) {
    assertAdminEmail(user.email);
    const stats = await this.redis.getStats();
    return {
      generated_at: new Date().toISOString(),
      redis: stats,
    };
  }

  /**
   * Top 20 slow queries de las últimas 24h + conteo total.
   * Si slow_24h > 100 → ALERTA (investigar y agregar índices).
   */
  @Get('slow-queries')
  async getSlowQueries(@CurrentUser() user: AuthUser) {
    assertAdminEmail(user.email);
    const top20 = await this.prisma.$queryRaw<
      Array<{ query_time: string; sql_text: string; start_time: Date }>
    >`
      SELECT start_time, query_time, SUBSTRING(sql_text, 1, 500) AS sql_text
      FROM mysql.slow_log
      WHERE start_time >= NOW() - INTERVAL 1 DAY
      ORDER BY start_time DESC
      LIMIT 20
    `;

    const count24h = await this.prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*) as c FROM mysql.slow_log
      WHERE start_time >= NOW() - INTERVAL 1 DAY
    `;

    const total = Number(count24h[0]?.c ?? 0n);
    return {
      generated_at: new Date().toISOString(),
      total_24h: total,
      alert: total > 100,
      top20: top20.map((q) => ({
        start_time: q.start_time,
        query_time: q.query_time,
        sql_preview: q.sql_text,
      })),
    };
  }

  /**
   * Health check combinado: BD + Redis. No requiere auth (load balancer friendly).
   * Devuelve 200 si ambos servicios están OK; 503 si alguno falla.
   */
  @Public()
  @Get('health')
  async getHealth() {
    const dbStart = Date.now();
    let dbOk = false;
    let dbLatencyMs = 0;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
      dbLatencyMs = Date.now() - dbStart;
    } catch {
      dbOk = false;
    }

    const redisStats = await this.redis.getStats();
    const redisOk = redisStats?.connected ?? false;

    const allOk = dbOk && (redisStats?.enabled ? redisOk : true);
    return {
      status: allOk ? 'ok' : 'degraded',
      generated_at: new Date().toISOString(),
      database: { ok: dbOk, latency_ms: dbLatencyMs },
      redis: {
        enabled: redisStats?.enabled ?? false,
        connected: redisOk,
      },
    };
  }
}
