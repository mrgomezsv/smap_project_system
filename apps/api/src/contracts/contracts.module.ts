import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractPdfService } from './services/contract-pdf.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../waivers/services/email.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContractsController],
  providers: [ContractsService, ContractPdfService, EmailService],
  exports: [ContractsService],
})
export class ContractsModule {}
