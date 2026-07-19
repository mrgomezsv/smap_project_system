import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { LikesModule } from './likes/likes.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [PrismaModule, AuthModule, ProductsModule, LikesModule, CommentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
