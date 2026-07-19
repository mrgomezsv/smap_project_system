import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
@Injectable()
export class UserMappingService {
  private readonly logger = new Logger(UserMappingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateFromFirebase(payload: {
    uid: string;
    email?: string;
    name?: string;
    token: string;
  }): Promise<AuthUser> {
    const username = payload.email || payload.uid;
    const email = payload.email || `${payload.uid}@firebase.local`;
    const name = payload.name || username.split('@')[0] || payload.uid.substring(0, 10);

    const user = await this.prisma.user.upsert({
      where: { username },
      update: {
        email,
        firstName: name,
      },
      create: {
        username,
        email,
        firstName: name,
        isActive: true,
      },
    });

    return {
      uid: payload.uid,
      email,
      name,
      userId: user.id,
      token: payload.token,
    };
  }
}
