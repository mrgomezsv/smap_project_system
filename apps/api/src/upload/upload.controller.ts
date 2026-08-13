import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';
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
      storage: diskStorage({
        destination: (req, file, cb) => {
          try {
            const rawUploadDir = process.env.UPLOAD_DIR || 'media';
            const uploadDir = rawUploadDir.startsWith('/')
              ? rawUploadDir
              : join(process.cwd(), rawUploadDir);
            const slug = (req.body?.slug as string) || '';
            const sub = slug ? join(uploadDir, 'product_images', slug) : uploadDir;
            if (!existsSync(sub)) {
              mkdirSync(sub, { recursive: true });
            }
            cb(null, sub);
          } catch (e) {
            cb(e as Error, '');
          }
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname || '') || '.jpg';
          const random = randomBytes(4).toString('hex');
          const slug = (req.body?.slug as string) || 'img';
          const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '_');
          cb(null, `${safeSlug}_${random}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype?.startsWith('image/')) {
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
    const relativePath = this.uploadService.toRelativePath(file.path);
    return {
      path: relativePath,
      size: file.size,
      mimetype: file.mimetype,
      slug: slug || null,
    };
  }
}
