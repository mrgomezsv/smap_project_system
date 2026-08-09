import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private static readonly SLOW_QUERY_THRESHOLD_MS = 200;

  constructor() {
    const url = process.env.DATABASE_URL ?? '';
    // Si la URL no trae params de pool, agregarlos por defecto
    const tunedUrl = url.includes('connection_limit')
      ? url
      : injectPoolParams(url);

    super({
      datasources: { db: { url: tunedUrl } },
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'query' },
      ],
      // Error formatting para mensajes más legibles
      errorFormat: 'pretty',
    });

    // Log de queries lentas (>200ms)
    this.$on('warn' as never, (e: Prisma.LogEvent) => {
      this.logger.warn(`Prisma warn: ${e.message}`);
    });
    this.$on('error' as never, (e: Prisma.LogEvent) => {
      this.logger.error(`Prisma error: ${e.message}`);
    });
    this.$on('query' as never, (e: Prisma.QueryEvent) => {
      if (e.duration >= PrismaService.SLOW_QUERY_THRESHOLD_MS) {
        this.logger.warn(
          `Slow query (${e.duration}ms): ${e.query.slice(0, 200)}${e.query.length > 200 ? '...' : ''}`,
        );
      }
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      // Healthcheck
      await this.$queryRaw`SELECT 1 as healthcheck`;
      this.logger.log('Conectado a la base de datos MariaDB');
    } catch (error) {
      this.logger.error(
        'Error al conectar con la base de datos',
        error as Error,
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Desconectado de la base de datos');
  }
}

function injectPoolParams(url: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}connection_limit=10&pool_timeout=20&socket_timeout=30&connect_timeout=10`;
}
