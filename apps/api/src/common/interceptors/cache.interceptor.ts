import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';

export const CACHE_TTL_METADATA = 'cache_ttl_seconds';
export const SKIP_CACHE_METADATA = 'skip_cache';

/**
 * Decorator para cachear la respuesta de un endpoint.
 * @param ttlSeconds - TTL en segundos. Default 60s.
 *
 * @example
 *   @Cache(30)
 *   @Get()
 *   findAll() { ... }
 */
export const Cache = (ttlSeconds = 60) => SetMetadata(CACHE_TTL_METADATA, ttlSeconds);
export const SkipCache = () => SetMetadata(SKIP_CACHE_METADATA, true);

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * Cache interceptor en memoria con TTL por endpoint.
 *
 * - Solo aplica a métodos GET (decorador @Get)
 * - Usa el path completo + query string como key
 * - Limpia automáticamente entradas expiradas en cada GET
 * - Para producción: reemplazar por Redis (misma interfaz)
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly store = new Map<string, CacheEntry>();

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.get<boolean>(
      SKIP_CACHE_METADATA,
      context.getHandler(),
    );
    if (skip) return next.handle();

    const ttl = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );
    if (!ttl) return next.handle();

    const req = context.switchToHttp().getRequest();
    if (req.method !== 'GET') return next.handle();

    const key = this.buildKey(req);
    const now = Date.now();

    // Limpieza oportunista de entradas expiradas (limita el map)
    if (this.store.size > 500) {
      for (const [k, v] of this.store) {
        if (v.expiresAt <= now) this.store.delete(k);
      }
    }

    const cached = this.store.get(key);
    if (cached && cached.expiresAt > now) {
      return of(cached.value);
    }

    return next.handle().pipe(
      tap((value) => {
        this.store.set(key, { value, expiresAt: now + ttl * 1000 });
      }),
    );
  }

  /** Construye una key estable a partir de path + query */
  private buildKey(req: { url: string; originalUrl?: string }): string {
    return req.originalUrl ?? req.url ?? 'unknown';
  }

  /** Limpia todo el cache (útil en tests) */
  clear(): void {
    this.store.clear();
  }
}
