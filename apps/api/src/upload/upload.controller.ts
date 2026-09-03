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
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
      fileFilter: (req, file, cb) => {
        const isImageMime =
          file.mimetype?.startsWith('image/') ||
          file.mimetype === 'application/octet-stream';
        const isImageExt = /\.(jpg|jpeg|png|webp|gif|heic|heif|bmp|tiff|avif)$/i.test(
          file.originalname || '',
        );
        if (!isImageMime && !isImageExt) {
          cb(
            new BadRequestException(
              'Solo se permiten imágenes (JPG, PNG, WebP, HEIC)',
            ),
            false,
          );
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
    return this.uploadService.saveProductImage(file, slug);
  }

  /**
   * POST /api/upload/event-image
   * multipart/form-data con: file (File), title (string opcional)
   *
   * Devuelve: { path: string, filename: string, size: number, mimetype: string }
   */
  @Post('event-image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
      fileFilter: (req, file, cb) => {
        const isImageMime =
          file.mimetype?.startsWith('image/') ||
          file.mimetype === 'application/octet-stream';
        const isImageExt = /\.(jpg|jpeg|png|webp|gif|heic|heif|bmp|tiff|avif)$/i.test(
          file.originalname || '',
        );
        if (!isImageMime && !isImageExt) {
          cb(
            new BadRequestException(
              'Solo se permiten imágenes (JPG, PNG, WebP, HEIC)',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadEventImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    return this.uploadService.saveEventImage(file, title);
  }
}
