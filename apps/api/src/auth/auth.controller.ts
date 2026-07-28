import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './decorators/current-user.decorator';
import { FirebaseService } from './firebase.service';
import { assertAdminEmail } from './admin-allowlist';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Devuelve el usuario autenticado actualmente.
   * Requiere token Bearer válido (protegido por FirebaseAuthGuard global).
   * Si Firebase no está inicializado (modo dev), devuelve un usuario anónimo.
   */
  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  /**
   * Verifica si el usuario actual tiene permisos de administrador.
   * Lanza 403 Forbidden si el correo no está en el allowlist.
   */
  @Get('check-admin')
  checkAdmin(@CurrentUser() user: AuthUser) {
    assertAdminEmail(user.email);
    return { ok: true, email: user.email };
  }

  /**
   * Devuelve la lista de usuarios de Firebase Auth.
   * Requiere rol admin.
   */
  @Get('users')
  async listUsers(
    @CurrentUser() user: AuthUser,
    @Query('maxResults') maxResults?: string,
    @Query('pageToken') pageToken?: string,
  ) {
    assertAdminEmail(user.email);
    const limit = maxResults ? parseInt(maxResults, 10) : 100;
    const result = await this.firebaseService.listUsers(limit, pageToken);

    return {
      users: result.users.map((u) => ({
        id: u.uid,
        name: u.displayName || u.email?.split('@')[0] || 'Usuario sin nombre',
        email: u.email || 'Sin correo',
        registeredAt: u.metadata.creationTime
          ? new Date(u.metadata.creationTime).toISOString().split('T')[0]
          : 'N/A',
        lastLogin: u.metadata.lastSignInTime
          ? new Date(u.metadata.lastSignInTime).toLocaleString('es-ES')
          : 'Sin registros',
        photoUrl: u.photoURL,
        disabled: u.disabled,
      })),
      nextPageToken: result.pageToken,
    };
  }
}
