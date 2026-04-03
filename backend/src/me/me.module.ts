import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { EmployeeModule } from '../employee/employee.module';

@Module({
  imports: [EmployeeModule],
  controllers: [MeController],
})
export class MeModule {}
