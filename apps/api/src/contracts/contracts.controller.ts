import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ContractsService } from './contracts.service';
import { CreateContractDto, SignContractDto } from './dto/contract.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { assertAdminEmail } from '../auth/admin-allowlist';

@Controller('api/v2/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  // ==========================================
  // RUTA PÚBLICA DE FIRMA
  // ==========================================
  @Public()
  @Get('public/:token')
  async getPublicContract(@Param('token') token: string) {
    return this.contractsService.findByToken(token);
  }

  @Public()
  @Post('public/:token/sign')
  async signContract(
    @Param('token') token: string,
    @Body() dto: SignContractDto,
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '';
    const userAgent = req.headers['user-agent'] || '';

    return this.contractsService.signContract(token, {
      ...dto,
      signerIp: ip,
      signerUserAgent: userAgent,
    });
  }

  @Public()
  @Get('public/:token/pdf')
  async downloadPublicPdf(@Param('token') token: string, @Res() res: Response) {
    const buffer = await this.contractsService.getPdfBufferByToken(token);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Kidsfun_Rental_Agreement.pdf`,
    );
    res.send(buffer);
  }

  // ==========================================
  // RUTAS ADMINISTRATIVAS
  // ==========================================
  @Post()
  async createContract(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateContractDto,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.createContract(dto);
  }

  @Get()
  async findAllContracts(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.findAll({
      search,
      status,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      cursor: cursor ? Number(cursor) : undefined,
    });
  }
}
