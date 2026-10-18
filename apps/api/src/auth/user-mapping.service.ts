import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { AuthUser } from './decorators/current-user.decorator';

/**
 * Servicio que mapea un usuario autenticado por Firebase (vía token)
 * a un usuario en nuestra BD MariaDB. Equivalente al get_or_create
 * del Django FirebaseAuthentication.
 *
 * - Usa email como username (fallback al UID si no hay email)
 * - Crea el User si no existe
 * - Devuelve el user con su ID de BD para uso en queries
 */
/** Tiempo que se reutiliza el mapeo uid → usuario sin volver a la BD. */
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 2000;

@Injectable()
export class UserMappingService {
  private readonly logger = new Logger(UserMappingService.name);
  private readonly cache = new Map<
    string,
    { user: Omit<AuthUser, 'token'>; expiresAt: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsService: ClientsService,
  ) {}

  async getOrCreateFromFirebase(payload: {
    uid: string;
    email?: string;
    name?: string;
    emailVerified?: boolean;
    token: string;
  }): Promise<AuthUser> {
    const emailVerified = payload.emailVerified === true;

    // Cache por request: evita 3-4 queries (find/update user + upsert client)
    // en cada petición autenticada. La clave incluye email y verificación
    // para refrescar si cambian en Firebase.
    const cacheKey = `${payload.uid}|${payload.email ?? ''}|${emailVerified}`;
    const hit = this.cache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) {
      return { ...hit.user, token: payload.token };
    }
    const username = payload.email || payload.uid;
    const rawEmail = payload.email || `${payload.uid}@firebase.local`;
    const name =
      payload.name || username.split('@')[0] || payload.uid.substring(0, 10);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: rawEmail }],
      },
    });

    let user;
    if (existingUser) {
      user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email:
            existingUser.email === rawEmail ? rawEmail : existingUser.email,
          firstName: name,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          username,
          email: rawEmail,
          firstName: name,
          isActive: true,
        },
      });
    }

    const email =
      user.email && user.email.trim() !== '' ? user.email : rawEmail;
    // Solo vinculamos el perfil de Client por email si está verificado:
    // evita apropiarse del perfil de otra persona registrando su correo.
    if (emailVerified && email && email.trim() !== '') {
      try {
        await this.clientsService.upsertFromAuth({
          email,
          name,
          userId: user.id,
          source: 'firebase',
          skipEmptyOverwrites: true,
        });
      } catch (e) {
        this.logger.warn(
          `No se pudo sincronizar Client para ${email}: ${(e as Error).message}`,
        );
      }
    }

    const result: Omit<AuthUser, 'token'> = {
      uid: payload.uid,
      email,
      name,
      emailVerified,
      userId: user.id,
    };
    if (this.cache.size >= CACHE_MAX) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(cacheKey, { user: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return { ...result, token: payload.token };
  }
}
