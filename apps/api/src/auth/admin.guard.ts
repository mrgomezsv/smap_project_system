import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { assertAdmin } from './admin-allowlist';
import { AuthUser } from './decorators/current-user.decorator';

/**
 * Guard que exige rol admin (email en allowlist y verificado).
 * Corre después del FirebaseAuthGuard global, que ya inyectó req.user.
 * Las rutas marcadas con @Public() se omiten.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    assertAdmin(req.user);
    return true;
  }
}

/** Marca un controlador o handler como exclusivo de administradores. */
export const AdminOnly = () => applyDecorators(UseGuards(AdminGuard));
