import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Prisma } from '@prisma/client';

/**
 * Interceptor global que normaliza tipos de Prisma en las respuestas JSON:
 *
 * - BigInt → Number (o String si excede MAX_SAFE_INTEGER)
 * - Decimal → Number (con toFixed si tiene decimales)
 * - Date → ISO string
 * - Objetos/arrays → recursivo
 *
 * Sin esto, las respuestas lanzan "Do not know how to serialize a BigInt"
 * y los Decimals se muestran como {s,e,d}.
 *
 * NOTA: NO se aplica a `StreamableFile` (u otros valores no-JSON) para no
 * romper el streaming de archivos. Si se interviniera, Nest serializaría el
 * objeto del stream como JSON en vez de pipear el archivo al cliente.
 */
@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (this.shouldSkip(data)) return data;
        return this.transform(data);
      }),
    );
  }

  private shouldSkip(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (value instanceof StreamableFile) return true;
    return false;
  }

  private transform(value: unknown): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === 'bigint') {
      if (value <= BigInt(Number.MAX_SAFE_INTEGER) && value >= BigInt(Number.MIN_SAFE_INTEGER)) {
        return Number(value);
      }
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    // Prisma.Decimal (y duck-typed: cualquier objeto con .toFixed)
    if (
      typeof value === 'object' &&
      value !== null &&
      'toFixed' in value &&
      typeof (value as { toFixed?: unknown }).toFixed === 'function' &&
      !('toISOString' in value)
    ) {
      const n = Number(value as { toString(): string });
      return Number.isFinite(n) ? n : (value as { toString(): string }).toString();
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.transform(v));
    }

    if (typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = this.transform(v);
      }
      return out;
    }

    return value;
  }
}

// Re-export para evitar tree-shake de tipos de Prisma en builds aislados
export type _PrismaUsed = Prisma.Decimal;
