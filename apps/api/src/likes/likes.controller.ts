import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { LikesService } from './likes.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class ToggleLikeDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  productId!: number;
}

@Controller('api/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Public()
  @Get('product/:productId')
  countByProduct(@Param('productId') productId: string) {
    return this.likesService.countByProduct(Number(productId));
  }

  @Get('user/:userId/product/:productId')
  userHasFavorite(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.likesService.userHasFavorite(Number(userId), Number(productId));
  }

  @Post('toggle')
  toggle(@Body() dto: ToggleLikeDto, @CurrentUser() user: AuthUser) {
    return this.likesService.toggle(user.userId!, dto.productId);
  }
}
