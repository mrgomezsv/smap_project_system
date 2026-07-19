import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './decorators/current-user.decorator';

@Controller('api/auth')
export class AuthController {
  /**
   * Devuelve el usuario autenticado actualmente.
   * Requiere token Bearer válido (protegido por FirebaseAuthGuard global).
   * Si Firebase no está inicializado (modo dev), devuelve un usuario anónimo.
   */
  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
