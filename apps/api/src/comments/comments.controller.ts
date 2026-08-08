import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { assertAdminEmail } from '../auth/admin-allowlist';
import { IsInt, IsString, IsNotEmpty, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

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

@Controller('api/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get('product/:productId')
  byProduct(@Param('productId') productId: string) {
    return this.commentsService.findByProduct(Number(productId));
  }

  @Post()
  create(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.create(
      dto.productId,
      user.uid,
      user.name,
      dto.comment,
    );
  }

  // ==========================================
  // RUTAS ADMINISTRATIVAS
  // ==========================================
  @Get('all')
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('status') status?: 'all' | 'pending' | 'approved',
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    assertAdminEmail(user.email);
    return this.commentsService.findAll({
      search,
      status,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Patch(':id/approval')
  toggleApproval(
    @Param('id') id: string,
    @Body('isApproved') isApproved: boolean,
    @CurrentUser() user: AuthUser,
  ) {
    assertAdminEmail(user.email);
    return this.commentsService.toggleApproval(Number(id), isApproved);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    assertAdminEmail(user.email);
    return this.commentsService.remove(Number(id));
  }
}
