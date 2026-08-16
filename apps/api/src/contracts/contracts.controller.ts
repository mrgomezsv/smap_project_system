import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractsService } from './contracts.service';
import { ContractStorageService } from './services/contract-storage.service';
import {
  CancelContractDto,
  CreateContractDto,
  CreateContractPaymentDto,
  DeleteDocumentDto,
  DeletePaymentDto,
  HardDeleteContractDto,
  QueryContractsDto,
  SignContractDto,
  UpdateContractDto,
  UploadContractDocumentDto,
} from './dto/contract.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { assertAdminEmail } from '../auth/admin-allowlist';

const SIGNER_IP_MAX = 45;
const SIGNER_UA_MAX = 2000;

function extractSignerIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const first = forwarded.split(',')[0]?.trim() ?? '';
    if (first) return first.slice(0, SIGNER_IP_MAX);
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    const first =
      String(forwarded[0] ?? '')
        .split(',')[0]
        ?.trim() ?? '';
    if (first) return first.slice(0, SIGNER_IP_MAX);
  }
  const remote = String(req.socket?.remoteAddress ?? '').trim();
  return remote.slice(0, SIGNER_IP_MAX);
}

function extractSignerUserAgent(req: Request): string {
  const raw = req.headers['user-agent'];
  const value: string = Array.isArray(raw)
    ? String(raw[0] ?? '')
    : String(raw ?? '');
  return value.slice(0, SIGNER_UA_MAX);
}

@Controller('api/v2/contracts')
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly storageService: ContractStorageService,
  ) {}

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
    return this.contractsService.signContract(token, dto, {
      signerIp: extractSignerIp(req),
      signerUserAgent: extractSignerUserAgent(req),
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

  @Post()
  async createContract(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateContractDto,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.createContract(dto, user.userId ?? null);
  }

  @Get()
  async findAllContracts(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryContractsDto,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.findAll(query);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.findAdminDetail(id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractDto,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.updateContract(id, dto);
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelContractDto,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.cancelContract(id, dto);
  }

  @Post(':id/archive')
  async archive(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.archiveContract(id);
  }

  @Post(':id/resend-invite')
  async resendInvite(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.resendInvite(id);
  }

  @Post(':id/resend-signed')
  async resendSigned(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.resendSigned(id);
  }

  @Post(':id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
    }),
  )
  async uploadDocument(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadContractDocumentDto,
  ) {
    assertAdminEmail(user.email);
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    return this.contractsService.uploadDocument(
      id,
      file,
      dto,
      user.userId ?? null,
    );
  }

  @Get(':id/documents/:documentId/download')
  async downloadDocument(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    assertAdminEmail(user.email);
    const numericId = this.parseDocumentId(documentId);
    const result = await this.contractsService.downloadDocument(id, numericId);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename.replace(/["\r\n]/g, '_')}"`,
    );
    res.send(result.buffer);
  }

  @Delete(':id/documents/:documentId')
  async deleteDocument(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId') documentId: string,
    @Body() dto: DeleteDocumentDto,
  ) {
    assertAdminEmail(user.email);
    const numericId = this.parseDocumentId(documentId);
    return this.contractsService.deleteDocument(
      id,
      numericId,
      dto.reason,
      user.userId ?? null,
    );
  }

  @Post(':id/payments')
  async addPayment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateContractPaymentDto,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.addPayment(id, dto, user.userId ?? null);
  }

  @Delete(':id/payments/:paymentId')
  async deletePayment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('paymentId') paymentId: string,
    @Body() dto: DeletePaymentDto,
  ) {
    assertAdminEmail(user.email);
    const numericId = this.parsePaymentId(paymentId);
    return this.contractsService.deletePayment(
      id,
      numericId,
      dto.reason,
      user.userId ?? null,
    );
  }

  @Delete(':id')
  async hardDelete(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HardDeleteContractDto,
  ) {
    assertAdminEmail(user.email);
    return this.contractsService.hardDeleteContract(
      id,
      dto.reason,
      user.userId ?? null,
    );
  }

  private parseDocumentId(raw: string): bigint {
    if (!/^\d+$/.test(raw)) {
      throw new NotFoundException(
        `Identificador de documento inválido: ${raw}`,
      );
    }
    try {
      return BigInt(raw);
    } catch {
      throw new NotFoundException(
        `Identificador de documento inválido: ${raw}`,
      );
    }
  }

  private parsePaymentId(raw: string): bigint {
    if (!/^\d+$/.test(raw)) {
      throw new NotFoundException(`Identificador de pago inválido: ${raw}`);
    }
    try {
      return BigInt(raw);
    } catch {
      throw new NotFoundException(`Identificador de pago inválido: ${raw}`);
    }
  }
}
