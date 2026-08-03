import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join, resolve } from 'path';
import { randomBytes } from 'crypto';
import { UploadService } from './upload.service';

const uploadDir = resolve(process.env.UPLOAD_DIR ?? join(process.cwd(), 'media'));
const productImagesDir = join(uploadDir, 'product_images');
const productImageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    if (!existsSync(productImagesDir)) {
      mkdirSync(productImagesDir, { recursive: true });
    }
    cb(null, productImagesDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${randomBytes(16).toString('hex')}${extname(file.originalname).toLowerCase()}`);
  },
});

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
      storage: productImageStorage,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Solo se permiten imágenes'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    return {
      path: this.uploadService.toRelativePath(file.path),
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
