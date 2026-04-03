import { Module } from '@nestjs/common';
import { WorkingShiftService } from './working-shift.service';
import { WorkingShiftController } from './working-shift.controller';

@Module({
  controllers: [WorkingShiftController],
  providers:   [WorkingShiftService],
  exports:     [WorkingShiftService],
})
export class WorkingShiftModule {}
