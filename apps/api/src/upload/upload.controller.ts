import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * POST /api/upload/product-image
   * multipart/form-data con: file (File), slug (string opcional)
   *
   * Devuelve: { path: string, size: number, mimetype: string }
   */
  @Post('product-image')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Solo se permiten imágenes'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('slug') slug?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    return {
      path: this.uploadService.toRelativePath(file.path),
      size: file.size,
      mimetype: file.mimetype,
      slug: slug || null,
    };
  }
}
