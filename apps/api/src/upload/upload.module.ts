import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { GoogleDriveService } from './google-drive.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, GoogleDriveService],
  exports: [UploadService, GoogleDriveService],
})
export class UploadModule {}
