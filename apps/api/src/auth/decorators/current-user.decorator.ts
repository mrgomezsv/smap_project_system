import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrae el usuario autenticado del request (inyectado por FirebaseAuthGuard).
 *
 * Uso:
 *   @Get('me')
 *   me(@CurrentUser() user: AuthUser) {
 *     return user;
 *   }
 */
export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  userId?: number; // ID en nuestra BD si se creó/recuperó
  token: string; // token original
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
