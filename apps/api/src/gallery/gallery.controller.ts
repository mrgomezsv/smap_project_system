import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
import {
  CreateAlbumDto,
  QueryAlbumsDto,
  ReorderPhotosDto,
  UpdateAlbumDto,
  UpdatePhotoDto,
} from './gallery.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { AdminOnly } from '../auth/admin.guard';
import { isAdminUser } from '../auth/admin-allowlist';
import {
  Cache,
  CacheInterceptor,
  CacheInvalidate,
  SkipCache,
} from '../common/interceptors/cache.interceptor';

const INVALIDATE = '/api/gallery*';

@Controller('api/gallery')
@UseInterceptors(CacheInterceptor)
export class GalleryController {
  constructor(private readonly gallery: GalleryService) {}

  // ---------- Público ----------

  /** GET /api/gallery - Álbumes publicados (más recientes primero) */
  @Public()
  @Cache(60)
  @Get()
  list(@Query() query: QueryAlbumsDto) {
    return this.gallery.list(query);
  }

  /** GET /api/gallery/product/:productId - Álbumes donde aparece un producto */
  @Public()
  @Cache(120)
  @Get('product/:productId')
  byProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.gallery.listByProduct(productId);
  }

  // ---------- Admin ----------

  /** GET /api/gallery/admin/all - Todos los álbumes, incluidos borradores */
  @AdminOnly()
  @SkipCache()
  @Get('admin/all')
  listAll(@Query() query: QueryAlbumsDto) {
    return this.gallery.list({ take: 50, ...query }, true);
  }

  /** GET /api/gallery/admin/:id - Detalle para el editor */
  @AdminOnly()
  @SkipCache()
  @Get('admin/:id')
  detailForAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.gallery.findById(id);
  }

  // Rutas de fotos antes que las de álbum (:id) para que 'photos' no se
  // interprete como id de álbum.
  @AdminOnly()
  @SkipCache()
  @CacheInvalidate(INVALIDATE)
  @Patch('photos/:photoId')
  updatePhoto(
    @Param('photoId', ParseIntPipe) photoId: number,
    @Body() dto: UpdatePhotoDto,
  ) {
    return this.gallery.updatePhoto(photoId, dto.caption);
  }

  @AdminOnly()
  @SkipCache()
  @CacheInvalidate(INVALIDATE)
  @Delete('photos/:photoId')
  removePhoto(@Param('photoId', ParseIntPipe) photoId: number) {
    return this.gallery.removePhoto(photoId);
  }

  @AdminOnly()
  @SkipCache()
  @CacheInvalidate(INVALIDATE)
  @Post()
  create(@Body() dto: CreateAlbumDto) {
    return this.gallery.create(dto);
  }

  @AdminOnly()
  @SkipCache()
  @CacheInvalidate(INVALIDATE)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAlbumDto) {
    return this.gallery.update(id, dto);
  }

  @AdminOnly()
  @SkipCache()
  @CacheInvalidate(INVALIDATE)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gallery.remove(id);
  }

  /** POST /api/gallery/:id/photos - multipart "files" (hasta 20 por envío) */
  @AdminOnly()
  @SkipCache()
  @CacheInvalidate(INVALIDATE)
  @Post(':id/photos')
  @UseInterceptors(
    FilesInterceptor('files', 20, { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  addPhotos(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.gallery.addPhotos(id, files);
  }

  @AdminOnly()
  @SkipCache()
  @CacheInvalidate(INVALIDATE)
  @Patch(':id/photos/order')
  reorder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderPhotosDto,
  ) {
    return this.gallery.reorderPhotos(id, dto.photoIds);
  }

  /**
   * GET /api/gallery/:slug - Detalle público de un álbum.
   * Declarada al final para no capturar las rutas anteriores. Los admins
   * (con token) pueden previsualizar borradores.
   */
  @Public()
  @Cache(60)
  @Get(':slug')
  detail(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return this.gallery.findBySlug(slug, isAdminUser(user));
  }
}
