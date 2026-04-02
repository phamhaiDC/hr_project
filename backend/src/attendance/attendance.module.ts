import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AttendanceService } from './attendance.service';
import { AttendanceProcessorService } from './attendance-processor.service';
import { AttendanceController } from './attendance.controller';
import { ShiftService } from './shift.service';
import { LocationService } from './location.service';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [ScheduleModule.forRoot(), CalendarModule],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    AttendanceProcessorService,
    ShiftService,
    LocationService,
  ],
  exports: [AttendanceService, ShiftService, LocationService],
})
export class AttendanceModule {}
