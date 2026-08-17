import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { EventsModule } from './events/events.module';
import { LikesModule } from './likes/likes.module';
import { CommentsModule } from './comments/comments.module';
import { WaiversModule } from './waivers/waivers.module';
import { PushModule } from './push/push.module';
import { ChatModule } from './chat/chat.module';
import { ContactMessagesModule } from './contact/contact-messages.module';
import { UploadModule } from './upload/upload.module';
import { ContractsModule } from './contracts/contracts.module';
import { ClientsModule } from './clients/clients.module';

import { DashboardModule } from './dashboard/dashboard.module';
import { MetricsModule } from './metrics/metrics.module';

import { CategoriesModule } from './categories/categories.module';
import { RedisModule } from './redis/redis.module';
import { MediaController } from './media/media.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    EventsModule,
    LikesModule,
    CommentsModule,
    WaiversModule,
    PushModule,
    ChatModule,
    ContactMessagesModule,
    UploadModule,
    ContractsModule,
    ClientsModule,
    DashboardModule,
    MetricsModule,
    RedisModule,
  ],
  controllers: [AppController, MediaController],
  providers: [AppService],
})
export class AppModule {}
