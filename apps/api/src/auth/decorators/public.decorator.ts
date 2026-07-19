import { SetMetadata } from '@nestjs/common';

/**
 * Marca una ruta como pública: el FirebaseAuthGuard la dejará pasar
 * sin requerir token.
 *
 * Uso:
 *   @Public()
 *   @Get('health')
 *   health() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
