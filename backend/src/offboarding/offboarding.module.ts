import { Module } from '@nestjs/common';
import { OffboardingService } from './offboarding.service';
import { OffboardingApprovalService } from './offboarding-approval.service';
import { OffboardingController } from './offboarding.controller';
import { AuditModule } from '../audit/audit.module';
import { LeaveModule } from '../leave/leave.module';

@Module({
  imports: [AuditModule, LeaveModule],
  controllers: [OffboardingController],
  providers: [OffboardingService, OffboardingApprovalService],
  exports: [OffboardingService],
})
export class OffboardingModule {}
