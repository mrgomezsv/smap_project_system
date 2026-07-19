import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { FirebaseService } from './firebase.service';
import { UserMappingService } from './user-mapping.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Global()
@Module({
  providers: [
    FirebaseService,
    UserMappingService,
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
  exports: [FirebaseService, UserMappingService],
})
export class AuthModule {}
