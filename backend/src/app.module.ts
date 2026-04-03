import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';
import { OrganizationModule } from './organization/organization.module';
import { ContractModule } from './contract/contract.module';
import { LeaveModule } from './leave/leave.module';
import { AttendanceModule } from './attendance/attendance.module';
import { WorkflowModule } from './workflow/workflow.module';
import { OffboardingModule } from './offboarding/offboarding.module';
import { RewardModule } from './reward/reward.module';
import { AuditModule } from './audit/audit.module';
import { CalendarModule } from './calendar/calendar.module';
import { OfficeModule } from './office/office.module';
import { WorkingShiftModule } from './working-shift/working-shift.module';
import { MeModule } from './me/me.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EmployeeModule,
    MeModule,
    OrganizationModule,
    ContractModule,
    LeaveModule,
    CalendarModule,
    AttendanceModule,
    WorkflowModule,
    OffboardingModule,
    RewardModule,
    AuditModule,
    OfficeModule,
    WorkingShiftModule,
  ],
})
export class AppModule {}
