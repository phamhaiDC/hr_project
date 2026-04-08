import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
  imports: [SystemConfigModule],
  providers: [NotificationService]
})
export class NotificationModule {}
