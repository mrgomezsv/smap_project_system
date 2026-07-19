import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { UserMappingService } from './user-mapping.service';

@Global()
@Module({
  providers: [FirebaseService, UserMappingService],
  exports: [FirebaseService, UserMappingService],
})
export class AuthModule {}
