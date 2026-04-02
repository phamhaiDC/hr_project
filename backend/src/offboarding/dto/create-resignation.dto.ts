import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class CreateResignationDto {
  @ApiProperty({ example: '2024-04-15' })
  @IsDateString()
  lastWorkingDate: string;

  @ApiProperty({ example: 'Personal reasons' })
  @IsString()
  reason: string;
}
