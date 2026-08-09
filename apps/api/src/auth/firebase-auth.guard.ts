import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { FirebaseService } from './firebase.service';
import { UserMappingService } from './user-mapping.service';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { AuthUser } from './decorators/current-user.decorator';

/**
 * Guard global que valida el Bearer token de Firebase.
 *
 * Comportamiento:
 * - Si la ruta está marcada con @Public(), pasa sin auth
 * - Si Firebase NO está inicializado (sin credenciales), permite pasar
 *   con un AuthUser "anónimo" para no bloquear el desarrollo
 * - Si Firebase está inicializado y la ruta no es pública:
 *     - Lee Authorization: Bearer <token>
 *     - Verifica con Firebase Admin
 *     - Mapea/crea el User en BD
 *     - Inyecta req.user con AuthUser
 *     - Si falla, lanza 401
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly firebaseService: FirebaseService,
    private readonly userMapping: UserMappingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Si Firebase no está inicializado (modo dev sin credenciales),
    // creamos/obtenemos un User "dev-anonymous" en BD para tener userId
    // real y poder usar endpoints que lo requieren
    if (!this.firebaseService.isInitialized()) {
      this.logger.debug(
        'Firebase no inicializado - usando user dev (modo dev)',
      );
      const devUser = await this.userMapping.getOrCreateFromFirebase({
        uid: 'dev-anonymous',
        email: 'dev@local',
        name: 'Dev User',
        token: '',
      });
      (request as Request & { user?: AuthUser }).user = devUser;
      return true;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticación requerido');
    }

    const idToken = authHeader.split(' ')[1];
    try {
      const decoded = await this.firebaseService.verifyIdToken(idToken);
      const authUser = await this.userMapping.getOrCreateFromFirebase({
        uid: decoded.uid,
        email: decoded.email,
        name:
          decoded.name ||
          (decoded.email ? decoded.email.split('@')[0] : decoded.uid),
        token: idToken,
      });
      (request as Request & { user?: AuthUser }).user = authUser;
      return true;
    } catch (error) {
      this.logger.warn(`Token inválido: ${(error as Error).message}`);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
