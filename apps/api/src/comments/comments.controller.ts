import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
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
}
