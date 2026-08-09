import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';

export const CACHE_TTL_METADATA = 'cache_ttl_seconds';
export const SKIP_CACHE_METADATA = 'skip_cache';
export const CACHE_INVALIDATE_METADATA = 'cache_invalidate_patterns';

/**
 * Decorator para cachear la respuesta de un endpoint.
 * @param ttlSeconds - TTL en segundos. Default 60s.
 */
export const Cache = (ttlSeconds = 60) => SetMetadata(CACHE_TTL_METADATA, ttlSeconds);

/**
 * Decorator para NO cachear este endpoint.
 */
export const SkipCache = () => SetMetadata(SKIP_CACHE_METADATA, true);

/**
 * Decorator para invalidar entradas de cache que coincidan con los patterns dados
 * después de una mutación exitosa (POST/PATCH/DELETE).
 *
 * @param patterns - Lista de patrones glob estilo Redis (ej: 'cache:/api/products*').
 */
export const CacheInvalidate = (...patterns: string[]) =>
  SetMetadata(CACHE_INVALIDATE_METADATA, patterns);

interface MemoryCacheEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * Cache interceptor con Redis (distribuido) + fallback en memoria.
 *
 * - Solo aplica a métodos GET con @Cache(ttl) decorator.
 * - Key = `${req.originalUrl}::user=${req.user?.uid ?? 'public'}` (versionado por usuario).
 * - Si Redis no está disponible, usa Map en memoria.
 * - POST/PATCH/DELETE con @CacheInvalidate limpian los patterns dados.
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly memoryStore = new Map<string, MemoryCacheEntry>();

  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const handler = context.getHandler();
    const skip = this.reflector.get<boolean>(SKIP_CACHE_METADATA, handler);
    if (skip) return next.handle();

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    // Invalidación: aplicar en POST/PATCH/DELETE si tiene @CacheInvalidate
    const invalidatePatterns = this.reflector.get<string[]>(
      CACHE_INVALIDATE_METADATA,
      handler,
    );
    if (invalidatePatterns && req.method !== 'GET') {
      // Aplicar después de que el handler ejecute exitosamente
      return new Observable((subscriber) => {
        next.handle().subscribe({
          next: (value) => {
            // Solo invalidar en éxito (status 2xx)
            if (res.statusCode < 400) {
              const prefix = this.getKeyPrefix(req);
              const fullPatterns = invalidatePatterns.map((p) =>
                p.startsWith('cache:') ? p : `${prefix}${p}`,
              );
              // Ejecutar en paralelo, no bloqueamos la respuesta
              Promise.all([
                ...fullPatterns.map((p) => this.redis.delByPattern(p)),
                ...fullPatterns.map((p) => this.delMemoryByPattern(p)),
              ]).catch(() => {});
            }
            subscriber.next(value);
          },
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    }

    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, handler);
    if (!ttl || req.method !== 'GET') return next.handle();

    const key = this.buildKey(req);

    // 1. Intentar Redis primero
    if (this.redis.isEnabled()) {
      const cached = await this.redis.get(key);
      if (cached) {
        try {
          return of(JSON.parse(cached));
        } catch {
          // valor corrupto, ignorar
        }
      }
    } else {
      // 2. Fallback: memoria
      const mem = this.memoryStore.get(key);
      if (mem && mem.expiresAt > Date.now()) {
        return of(mem.value);
      }
      // Limpieza oportunista
      if (this.memoryStore.size > 500) {
        const now = Date.now();
        for (const [k, v] of this.memoryStore) {
          if (v.expiresAt <= now) this.memoryStore.delete(k);
        }
      }
    }

    return next.handle().pipe(
      tap(async (value) => {
        // Guardar en Redis
        if (this.redis.isEnabled()) {
          await this.redis.set(key, JSON.stringify(value), ttl);
        } else {
          // Fallback memoria
          this.memoryStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
        }
      }),
    );
  }

  private buildKey(req: { originalUrl?: string; url?: string; user?: { uid?: string } }): string {
    const url = req.originalUrl ?? req.url ?? 'unknown';
    const userId = req.user?.uid ?? 'public';
    return `cache:${url}::user=${userId}`;
  }

  private getKeyPrefix(req: { originalUrl?: string; url?: string }): string {
    const url = req.originalUrl ?? req.url ?? 'unknown';
    // Devuelve el prefijo hasta el primer '?' (inclusive) para usar con pattern matching
    return `cache:${url.split('?')[0]}*`;
  }

  private delMemoryByPattern(prefix: string): Promise<void> {
    // En memoria, simplemente limpiamos todo (no eficiente pero funcional)
    // Solo se ejecuta si Redis está caído
    if (!prefix.includes('*')) {
      this.memoryStore.delete(prefix);
    } else {
      const regex = new RegExp('^' + prefix.replace(/\*/g, '.*') + '$');
      for (const k of this.memoryStore.keys()) {
        if (regex.test(k)) this.memoryStore.delete(k);
      }
    }
    return Promise.resolve();
  }

  /** Limpia todo el cache (útil en tests) */
  clear(): void {
    this.memoryStore.clear();
  }
}