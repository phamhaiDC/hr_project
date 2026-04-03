import { PartialType } from '@nestjs/swagger';
import { CreateWorkingShiftDto } from './create-working-shift.dto';

export class UpdateWorkingShiftDto extends PartialType(CreateWorkingShiftDto) {}
