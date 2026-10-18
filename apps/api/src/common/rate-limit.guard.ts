import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RedisService } from '../redis/redis.service';

const RATE_LIMIT_KEY = 'rate_limit';

interface RateLimitOptions {
  /** Máximo de peticiones permitidas por ventana. */
  limit: number;
  /** Tamaño de la ventana en segundos. */
  windowSec: number;
}

/**
 * Limita peticiones por IP en un endpoint (anti-spam / anti-abuso).
 * Uso: @RateLimit({ limit: 5, windowSec: 600 })
 */
export const RateLimit = (opts: RateLimitOptions) =>
  applyDecorators(SetMetadata(RATE_LIMIT_KEY, opts), UseGuards(RateLimitGuard));

/** IP del cliente; detrás de Nginx/Next se toma el primer X-Forwarded-For. */
function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
  return first || req.socket?.remoteAddress || 'unknown';
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private static readonly memory = new Map<
    string,
    { count: number; resetAt: number }
  >();

  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const opts = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!opts) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const key = `rl:${context.getClass().name}.${context.getHandler().name}:${clientIp(req)}`;
    const count = await this.hit(key, opts.windowSec);
    if (count > opts.limit) {
      throw new HttpException(
        'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private async hit(key: string, windowSec: number): Promise<number> {
    const viaRedis = await this.redis.incrWithTtl(key, windowSec);
    if (viaRedis !== null) return viaRedis;

    // Fallback en memoria (una sola instancia)
    const now = Date.now();
    const mem = RateLimitGuard.memory;
    const entry = mem.get(key);
    if (!entry || entry.resetAt <= now) {
      if (mem.size > 10_000) {
        for (const [k, v] of mem) if (v.resetAt <= now) mem.delete(k);
      }
      mem.set(key, { count: 1, resetAt: now + windowSec * 1000 });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }
}
