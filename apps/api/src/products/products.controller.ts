import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Public } from '../auth/decorators/public.decorator';
import { AdminOnly } from '../auth/admin.guard';
import { isAdminUser } from '../auth/admin-allowlist';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import {
  CacheInterceptor,
  Cache,
  SkipCache,
  CacheInvalidate,
} from '../common/interceptors/cache.interceptor';

@Controller('api/products')
@UseInterceptors(CacheInterceptor)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Cache(60)
  @Get()
  list(@Query() query: QueryProductDto, @CurrentUser() user?: AuthUser) {
    // Solo los admins pueden listar productos no publicados
    if (!isAdminUser(user)) query.publicated = true;
    return this.productsService.findAll(query);
  }

  @Public()
  @Cache(60)
  @Get('category/:category')
  byCategory(
    @Param('category') category: string,
    @Query('lang') lang?: 'es' | 'en',
  ) {
    return this.productsService.findByCategory(category, lang);
  }

  @Public()
  @Cache(60)
  @Get(':id')
  detail(@Param('id') id: string, @Query('lang') lang?: 'es' | 'en') {
    return this.productsService.findOne(Number(id), lang);
  }

  @AdminOnly()
  @SkipCache()
  @CacheInvalidate('/api/products*', '/api/v2/waiver*')
  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) {
    return this.productsService.create(dto, user.userId!);
  }

  @AdminOnly()
  @SkipCache()
  @CacheInvalidate('/api/products*')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(Number(id), dto);
  }

  @AdminOnly()
  @SkipCache()
  @CacheInvalidate('/api/products*')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(Number(id));
  }
}
