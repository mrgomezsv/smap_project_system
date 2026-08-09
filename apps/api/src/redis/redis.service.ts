import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Servicio Redis singleton para cache distribuido.
 *
 * Si REDIS_URL no está configurada o CACHE_ENABLED=false, opera como no-op
 * (todas las operaciones devuelven null/false). Esto permite degradación
 * elegante: el API sigue funcionando sin cache si Redis cae.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private enabled = false;

  async onModuleInit() {
    const cacheEnabled = process.env.CACHE_ENABLED !== 'false';
    const redisUrl = process.env.REDIS_URL;

    if (!cacheEnabled || !redisUrl) {
      this.logger.warn('Redis deshabilitado (CACHE_ENABLED=false o REDIS_URL no configurada). Cache en memoria fallback.');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });

      this.client.on('error', (err) => {
        this.logger.error(`Redis error: ${err.message}`);
      });

      await this.client.connect();
      this.enabled = true;
      this.logger.log(`Conectado a Redis: ${redisUrl.replace(/:[^:@]+@/, ':***@')}`);
    } catch (err) {
      this.logger.error(`No se pudo conectar a Redis: ${(err as Error).message}`);
      this.enabled = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Métricas de Redis para endpoint de monitoring.
   * Devuelve null si Redis está deshabilitado o caído.
   */
  async getStats(): Promise<{
    enabled: boolean;
    connected: boolean;
    uptime_seconds?: number;
    used_memory_human?: string;
    used_memory_peak_human?: string;
    total_keys?: number;
    hit_rate_pct?: number;
    evicted_keys?: number;
  } | null> {
    if (!this.enabled || !this.client) {
      return { enabled: this.enabled, connected: false };
    }
    try {
      const info = await this.client.info();
      const parsed = this.parseInfo(info);
      return {
        enabled: true,
        connected: this.client.status === 'ready',
        uptime_seconds: Number(parsed.uptime_in_seconds ?? 0),
        used_memory_human: parsed.used_memory_human,
        used_memory_peak_human: parsed.used_memory_peak_human,
        total_keys: Number(parsed.db0?.split(',')[0]?.split('=')[1] ?? 0),
        hit_rate_pct: this.calcHitRate(parsed),
        evicted_keys: Number(parsed.evicted_keys ?? 0),
      };
    } catch (e) {
      return { enabled: true, connected: false };
    }
  }

  private parseInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const line of info.split('\n')) {
      if (line.startsWith('#') || !line.includes(':')) continue;
      const [key, value] = line.split(':', 2);
      result[key.trim()] = value.trim();
    }
    return result;
  }

  private calcHitRate(parsed: Record<string, string>): number {
    const hits = Number(parsed.keyspace_hits ?? 0);
    const misses = Number(parsed.keyspace_misses ?? 0);
    const total = hits + misses;
    if (total === 0) return 0;
    return Math.round((hits / total) * 10000) / 100; // 2 decimales
  }

  async get(key: string): Promise<string | null> {
    if (!this.enabled || !this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } catch {
      // Silently fail — cache is optional
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.enabled || !this.client || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch {
      // Silently fail
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      // SCAN para no bloquear Redis en producción
      let cursor = '0';
      const toDelete: string[] = [];
      do {
        const [next, batch] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = next;
        toDelete.push(...batch);
      } while (cursor !== '0');

      if (toDelete.length > 0) {
        await this.client.del(...toDelete);
      }
    } catch {
      // Silently fail
    }
  }
}