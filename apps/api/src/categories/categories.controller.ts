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
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from '../auth/decorators/public.decorator';
import {
  CacheInterceptor,
  Cache,
  SkipCache,
  CacheInvalidate,
} from '../common/interceptors/cache.interceptor';

@Controller('api/categories')
@UseInterceptors(CacheInterceptor)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Cache(120)
  @Get()
  listActive(@Query('lang') lang?: 'es' | 'en') {
    return this.categoriesService.findAllActive(lang);
  }

  @SkipCache()
  @Get('admin')
  listAdmin() {
    return this.categoriesService.findAllAdmin();
  }

  @SkipCache()
  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @SkipCache()
  @CacheInvalidate('/api/categories*', '/api/products*')
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @SkipCache()
  @CacheInvalidate('/api/categories*', '/api/products*')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @SkipCache()
  @CacheInvalidate('/api/categories*', '/api/products*')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
