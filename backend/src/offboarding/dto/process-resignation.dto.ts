import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class ProcessResignationDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';
}
