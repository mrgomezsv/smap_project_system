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
@Injectable()
export class UserMappingService {
  private readonly logger = new Logger(UserMappingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clientsService: ClientsService,
  ) {}

  async getOrCreateFromFirebase(payload: {
    uid: string;
    email?: string;
    name?: string;
    token: string;
  }): Promise<AuthUser> {
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
    if (email && email.trim() !== '') {
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

    return {
      uid: payload.uid,
      email,
      name,
      userId: user.id,
      token: payload.token,
    };
  }
}
