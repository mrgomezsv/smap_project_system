import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { WaiversService } from './waivers.service';
import { CreateWaiverDto } from './dto/create-waiver.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

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
   * GET /api/v2/waiver/:qr - Obtener waiver por código QR
   */
  @Get(':qr')
  findByQr(@Param('qr') qr: string) {
    return this.waiversService.findByQr(qr);
  }

  /**
   * GET /api/v2/waiver/user/:uid - Lista de waivers del usuario
   */
  @Get('user/:uid')
  findByUser(@Param('uid') uid: string, @CurrentUser() user: AuthUser) {
    return this.waiversService.findByUser(user.uid, uid);
  }

  /**
   * POST /api/v2/waiver/validate - Validar QR y registrar scan
   */
  @Post('validate')
  validate(@Body() dto: ValidateWaiverDto, @CurrentUser() user: AuthUser) {
    const scannedBy = user.email || user.uid;
    return this.waiversService.validate(dto.qrCode, scannedBy);
  }

  /**
   * GET /api/v2/waiver/download/:qr - Descargar PDF (requiere auth)
   */
  @Get('download/:qr')
  async download(
    @Param('qr') qr: string,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.waiversService.generatePdf(qr);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Waiver_${qr.toUpperCase()}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.send(pdfBuffer);
  }

  /**
   * GET /api/v2/waiver/collaborator/scans - Historial de scans del colaborador
   */
  @Get('collaborator/scans')
  getScans(@CurrentUser() user: AuthUser) {
    const email = user.email || user.uid;
    return this.waiversService.getCollaboratorScans(email);
  }
}
