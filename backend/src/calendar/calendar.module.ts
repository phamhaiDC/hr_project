import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { HolidayService } from './holiday.service';
import { CalendarController, HolidayController } from './calendar.controller';

@Module({
  controllers: [CalendarController, HolidayController],
  providers: [CalendarService, HolidayService],
  exports: [CalendarService, HolidayService],
})
export class CalendarModule {}
