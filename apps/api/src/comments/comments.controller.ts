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
  UseInterceptors,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { assertAdminEmail } from '../auth/admin-allowlist';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CacheInvalidate,
  CacheInterceptor,
} from '../common/interceptors/cache.interceptor';

class CreateCommentDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  productId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  comment!: string;
}

class UpdateCommentApprovalDto {
  @IsBoolean()
  isApproved!: boolean;
}

class QueryCommentsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(['all', 'pending', 'approved'])
  status?: 'all' | 'pending' | 'approved';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}

@Controller('api/comments')
@UseInterceptors(CacheInterceptor)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get('product/:productId')
  byProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.commentsService.findByProduct(productId);
  }

  @Post()
  create(@Body() dto: CreateCommentDto, @CurrentUser() user: AuthUser) {
    return this.commentsService.create(
      dto.productId,
      user.uid,
      user.name,
      dto.comment,
      user.userId,
    );
  }

  // ==========================================
  // RUTAS ADMINISTRATIVAS
  // ==========================================
  @Get('all')
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryCommentsDto) {
    assertAdminEmail(user.email);
    return this.commentsService.findAll(query);
  }

  @CacheInvalidate('cache:/api/products*')
  @Patch(':id/approval')
  toggleApproval(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentApprovalDto,
    @CurrentUser() user: AuthUser,
  ) {
    assertAdminEmail(user.email);
    return this.commentsService.toggleApproval(id, dto.isApproved);
  }

  @CacheInvalidate('cache:/api/products*')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    assertAdminEmail(user.email);
    return this.commentsService.remove(id);
  }
}
