import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { IsString, IsNotEmpty } from 'class-validator';

import { WaiversService } from './waivers.service';
import { CreateWaiverDto } from './dto/create-waiver.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { assertAdminEmail } from '../auth/admin-allowlist';

class ValidateWaiverDto {
  @IsString()
  @IsNotEmpty()
  qrCode!: string;
}

@Controller('api/v2/waiver')
export class WaiversController {
  constructor(private readonly waiversService: WaiversService) {}

  /**
   * POST /api/v2/waiver - Crear waiver con QR único + email + PDF
   */
  @Post()
  create(@Body() dto: CreateWaiverDto, @CurrentUser() user: AuthUser) {
    return this.waiversService.create(user.uid, dto);
  }

  /**
   * GET /api/v2/waiver/all - Listar TODOS los waivers (admin only).
   * Soporta query params: ?status=ACTIVE|INACTIVE&take=50&skip=0&search=...
   */
  @Get('all')
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    assertAdminEmail(user.email);
    return this.waiversService.findAll({
      take: take ? Math.min(parseInt(take, 10) || 50, 200) : 50,
      skip: skip ? parseInt(skip, 10) || 0 : 0,
      status,
      search,
    });
  }

  /**
   * GET /api/v2/waiver/user/me - Lista los waivers del usuario autenticado.
   * Equivalente a user/:uid pero resuelve el uid desde el token de Firebase.
   * (Ruta declarada antes que user/:uid para evitar que `me` sea capturado).
   */
  @Get('user/me')
  findByMe(@CurrentUser() user: AuthUser) {
    return this.waiversService.findByUser(user.uid, user.uid);
  }

  /**
   * GET /api/v2/waiver/user/:uid - Lista de waivers del usuario
   */
  @Get('user/:uid')
  findByUser(@Param('uid') uid: string, @CurrentUser() user: AuthUser) {
    return this.waiversService.findByUser(user.uid, uid);
  }

  /**
   * POST /api/v2/waiver/validate - Validar QR y registrar scan (admin only).
   * Lanza 403 si el email no está en ADMIN_EMAILS.
   */
  @Post('validate')
  validate(@Body() dto: ValidateWaiverDto, @CurrentUser() user: AuthUser) {
    assertAdminEmail(user.email);
    const scannedBy = user.email || user.uid;
    return this.waiversService.validate(dto.qrCode, scannedBy);
  }

  /**
   * GET /api/v2/waiver/collaborator/scans - Historial de scans (admin only).
   */
  @Get('collaborator/scans')
  getScans(@CurrentUser() user: AuthUser) {
    assertAdminEmail(user.email);
    const email = user.email || user.uid;
    return this.waiversService.getCollaboratorScans(email);
  }

  /**
   * GET /api/v2/waiver/download/:qr - Descargar PDF del waiver por código QR.
   */
  @Public()
  @Get('download/:qr')
  async download(
    @Param('qr') qr: string,
    @Query('lang') lang: string,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.waiversService.generatePdf(qr, lang);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Waiver_${qr.toUpperCase()}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.send(pdfBuffer);
  }

  /**
   * POST /api/v2/waiver/resend-email - Reenviar waiver por correo
   */
  @Post('resend-email')
  async resendEmail(
    @Body('qrCode') qrCode: string,
    @Body('lang') lang: 'es' | 'en',
    @CurrentUser() user: AuthUser,
  ) {
    assertAdminEmail(user.email);
    const sent = await this.waiversService.resendWaiverEmail(qrCode, lang || 'es');
    return { success: sent, message: sent ? 'Email enviado exitosamente' : 'Error al enviar el email' };
  }

  /**
   * POST /api/v2/waiver/delete-batch - Eliminar waivers por IDs (admin only).
   */
  @Post('delete-batch')
  deleteBatch(@Body('ids') ids: string[], @CurrentUser() user: AuthUser) {
    assertAdminEmail(user.email);
    return this.waiversService.deleteMany(ids);
  }

  /**
   * GET /api/v2/waiver/verify/:qr - Obtener waiver por código QR para verificación pública.
   */
  @Public()
  @Get('verify/:qr')
  verifyByQr(@Param('qr') qr: string) {
    return this.waiversService.findByQr(qr);
  }

  /**
   * GET /api/v2/waiver/:qr - Obtener waiver por código QR (genérico).
   * Declarado al final para no capturar rutas específicas.
   */
  @Public()
  @Get(':qr')
  findByQr(@Param('qr') qr: string) {
    return this.waiversService.findByQr(qr);
  }
}
