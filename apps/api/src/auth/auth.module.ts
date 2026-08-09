import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { FirebaseService } from './firebase.service';
import { UserMappingService } from './user-mapping.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AuthController } from './auth.controller';
import { EmailService } from '../waivers/services/email.service';
import { ClientsModule } from '../clients/clients.module';

@Global()
@Module({
  imports: [ClientsModule],
  controllers: [AuthController],
  providers: [
    FirebaseService,
    UserMappingService,
    EmailService,
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
  exports: [FirebaseService, UserMappingService, EmailService],
})
export class AuthModule {}
