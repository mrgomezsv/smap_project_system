import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractPdfService } from './services/contract-pdf.service';
import { ContractStorageService } from './services/contract-storage.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../waivers/services/email.service';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [PrismaModule, ClientsModule],
  controllers: [ContractsController],
  providers: [
    ContractsService,
    ContractPdfService,
    ContractStorageService,
    EmailService,
  ],
  exports: [ContractsService],
})
export class ContractsModule {}
