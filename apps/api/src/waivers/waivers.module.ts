import { Module } from '@nestjs/common';
import { WaiversController } from './waivers.controller';
import { WaiversService } from './waivers.service';
import { PdfService } from './services/pdf.service';
import { QrService } from './services/qr.service';
import { EmailService } from './services/email.service';

@Module({
  controllers: [WaiversController],
  providers: [WaiversService, PdfService, QrService, EmailService],
  exports: [WaiversService],
})
export class WaiversModule {}
