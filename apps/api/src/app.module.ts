import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { LikesModule } from './likes/likes.module';
import { CommentsModule } from './comments/comments.module';
import { WaiversModule } from './waivers/waivers.module';
import { PushModule } from './push/push.module';
import { ChatModule } from './chat/chat.module';
import { ContactMessagesModule } from './contact/contact-messages.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    LikesModule,
    CommentsModule,
    WaiversModule,
    PushModule,
    ChatModule,
    ContactMessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
